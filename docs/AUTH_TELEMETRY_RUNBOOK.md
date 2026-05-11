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

## 3. Required alerts / conversions

Mark `auth_partial_profile` and `auth_rollback_failed` as **conversions**
in GA4 admin (Configure → Events → mark as conversion).

Then in GA4 → Insights → Create insight:

- **Trigger:** `auth_partial_profile` count > 0 in the past day.
- **Frequency:** daily, with an email alert to the on-call channel.

Same alert for `auth_rollback_failed`. Both should be zero in steady
state; any non-zero is actionable.

## 4. Recommended dashboard

Pin in GA4 → Explore → Funnel exploration → New exploration:

> Step 1: `first_visit`
> Step 2: `sign_up` OR `login`
> Step 3: `page_view` on `/setup`
> Step 4: `page_view` on `/dashboard*`

A regression like the May 2026 bug shows as a Step 3 dropoff to ~0% for
new users within an hour of deploy.

## 5. Repair scripts

When `auth_partial_profile` or `auth_rollback_failed` fires:

- `functions/scripts/diagnoseUserDoc.js <uid>` — classifies a single UID
  as `HEALTHY` / `CONSENT_ONLY` / `NO_DOC` / `EMPTY_DOC`.
- `functions/scripts/repairConsentOnlyUser.js <uid>` — see script header
  for repair semantics; pre-stamps `createdAt` from
  `auth.metadata.creationTime` for CONSENT_ONLY users.

(Both ship with PR-2 of the post-mortem hardening series.)
