# Auth Telemetry Runbook

Living reference for the GA4 events the splash-auth and route-guard code
emits, plus the GA4 console configuration needed to make them queryable.

Backstory: in May 2026 a 2-day regression (PR #393 → #399) silently routed
new sign-ups directly to `/dashboard` because the consent write created a
`users/{uid}` doc before profile setup, and the route guard tested the doc
for mere truthiness. We had ~30 minutes of guesswork tracing it through GA4
because the `auth_error` event's `method` and `error_code` parameters were
sent but never registered as custom dimensions — and we had no anomaly
signal at all for partial-profile state. This runbook keeps both gaps
closed.

## 1. Events emitted

All events flow through `src/features/auth/model/authAnalytics.js` and are
delivered via `ga4Event` in `src/shared/lib/ga4.js`. GA4 only initializes
on `setlistpickem.com` (prod) — preview/staging/localhost stay silent.

| Event | Source | Params | Meaning |
|---|---|---|---|
| `sign_up` | `useSplashSignUp` | `method` (`email` \| `google`) | New account created and consent recorded |
| `login` | `useSplashSignUp`, `useSplashSignIn` | `method` (`email` \| `google`) | Returning user signed in |
| `auth_error` | `useSplashSignUp`, `useSplashSignIn` | `method`, `error_code` (Firebase code or `unknown`) | Any auth-API throw — wrong password, popup-blocked, etc. |
| `auth_partial_profile` | `DashboardRoute` | `has_consent` (`true`/`false`), `surface` (`dashboard_route`) | **ANOMALY** — `users/{uid}` exists but `handle` missing |
| `auth_rollback` | `useSplashSignUp` | `method`, `stage` (`consent_write`) | Post-signup Firestore write failed; Auth account deletion initiated |
| `auth_rollback_failed` | `useSplashSignUp` | `method`, `error_code` | The `deleteUser` rollback itself failed — phantom Auth account exists |

## 2. Required GA4 console configuration

`method` and `error_code` flow on every `auth_error` event but are **not
queryable in `run_report`** until they're registered as event-scoped
custom dimensions. Same for the params on the new events.

**To register (one-time, 5 minutes):**

1. GA4 → Admin → Property `set-picks` (527619709)
2. Data display → Custom definitions → Create custom dimensions
3. Add each row:

| Dimension name (UI) | Scope | Event parameter | Description |
|---|---|---|---|
| `auth_method` | Event | `method` | Auth provider — `email` or `google` |
| `auth_error_code` | Event | `error_code` | Firebase Auth error code (e.g. `auth/wrong-password`) |
| `auth_rollback_stage` | Event | `stage` | Which post-signup write failed (`consent_write`) |
| `auth_partial_has_consent` | Event | `has_consent` | Whether the partial doc has `termsPrivacyAcceptedAt` |
| `auth_partial_surface` | Event | `surface` | Which route detected the partial state |

Historical data is **not backfilled**. New events landing after
registration become queryable via `run_report` with
`customEvent:method`, `customEvent:error_code`, etc.

### 2.1 Admin API (optional automation)

Same OAuth scope as manual setup: `https://www.googleapis.com/auth/analytics.edit`
(user `gcloud auth print-access-token --scopes=...` or a service account
with **Editor** on the GA4 property — Viewer is not enough for creates).

Repo scripts (property **527619709** / GCP header **set-picks** by default;
override with `GA4_PROPERTY_ID` / `GOOGLE_USER_PROJECT`):

- `scripts/ga4-create-auth-custom-dimensions-remaining.sh` — creates the
  four EVENT dimensions after `method` / `auth_method` exists.
- First dimension (`method`): `POST …/properties/{id}/customDimensions`
  with body
  `{"parameterName":"method","displayName":"auth_method","description":"Auth provider — email or google","scope":"EVENT"}`.

Verify: `GET …/properties/{id}/customDimensions`.

## 3. Key events and daily alerts

GA4 now treats “mark as conversion” for many workflows as **key events**
(Admin API: `properties.keyEvents.create`). The two anomaly events below
should be key events so they surface in conversion-oriented reports and
are easy to target for alerts.

### 3.1 Register key events (required)

**Automated (recommended):** from repo root, with `gcloud` user creds that
include `analytics.edit`:

```bash
./scripts/ga4-register-auth-key-events.sh
```

This registers **`auth_partial_profile`** and **`auth_rollback_failed`**
with `countingMethod: ONCE_PER_EVENT`.

If the API returns an error that the **event name is unknown**, GA4 has
not seen that event yet: ship a test hit from prod (`setlistpickem.com`)
or wait for real traffic, then re-run the script.

**UI fallback:** Admin → **Data display** → **Events** → open each event →
mark as **Key event** (wording may be “Mark as conversion” on older
layouts).

Verify: `GET https://analyticsadmin.googleapis.com/v1beta/properties/{PROPERTY_ID}/keyEvents`
(same auth headers as the custom-dimension scripts).

### 3.2 Daily email alerts (required; UI)

There is no stable, documented Admin API for GA4 **custom insights**
email delivery as of this writing — configure in the GA4 UI.

1. In the GA4 property, open **Insights** (left nav, or use the property
   search / command palette and search for **“Custom insight”**).
2. **Create** a custom insight for **`auth_partial_profile`**: condition
   **event count greater than 0** over **the last day** (or “yesterday”
   depending on UI wording).
3. Set **frequency** to **daily** and **email** to your on-call / team
   channel.
4. Repeat for **`auth_rollback_failed`**.

Both counts should stay **zero** in steady state; any non-zero day is
actionable (see §5).

## 4. Recommended funnel (Explore)

Build once in **Explore** and pin or bookmark.

1. GA4 → **Explore** → **Funnel exploration** → blank template.
2. **Segments** (optional): “New users” if you want to narrow (e.g. first
   visit in date range).
3. **Steps** (add in order):
   - Step 1: Event **`first_visit`** (or `session_start` if you prefer a
     wider funnel).
   - Step 2: Event **`sign_up`** OR **`login`** (configure as OR step per
     Explore UI — e.g. two branches or alternate condition your edition
     supports).
   - Step 3: Event **`page_view`** with dimension filter **page path**
     contains or equals **`/setup`** (exact match depends on how you send
     `page_location` / path).
   - Step 4: Event **`page_view`** with **page path** matching
     **`/dashboard`** (wildcard `*` if the UI supports “starts with” for
     dashboard routes).
4. Set the date range to **today** or **last 7 days** when validating after
   a deploy.

**How to read it:** a regression like the May 2026 consent-only bug shows
as **Step 3 collapsing toward ~0%** for affected new users (they never hit
`/setup`) while Step 4 still receives traffic — often visible within an
hour of a bad deploy if there is sign-up volume.

## 5. Repair scripts

When `auth_partial_profile` or `auth_rollback_failed` fires:

- `functions/scripts/diagnoseUserDoc.js <uid>` — classifies a single UID
  as `HEALTHY` / `CONSENT_ONLY` / `NO_DOC` / `EMPTY_DOC`.
- `functions/scripts/repairConsentOnlyUser.js <uid>` — see script header
  for repair semantics; pre-stamps `createdAt` from
  `auth.metadata.creationTime` for CONSENT_ONLY users.

(Both ship with PR-2 of the post-mortem hardening series.)
