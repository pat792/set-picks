# Phish.net callable runbook

Operational guide for **`getPhishnetSetlist`** (Firebase Gen2 callable → Phish.net v5). For key hygiene, env flags, and first-time setup, see **README.md** (“Phish.net API key”). This doc is the **ordered triage** path when something breaks.

**Related:** issue [#146](https://github.com/pat792/set-picks/issues/146), epic [#42](https://github.com/pat792/set-picks/issues/42).

---

## Quick reference

| Item | Location / value |
|------|------------------|
| Callable | `functions/index.js` → `exports.getPhishnetSetlist` |
| Region | `us-central1` — must match `PHISHNET_CALLABLE_REGION` in `src/features/admin-setlist-config/api/phishApiClient.js` |
| Secret | `PHISHNET_API_KEY` (Secret Manager; sync via `npm run secrets:sync-phishnet`) |
| Client flags | `VITE_SETLIST_API_SOURCE=phishnet`, `VITE_USE_CALLABLE_PHISHNET_SETLIST=true` |
| Admin gate | Same email as `useAdminSetlistForm` / `ADMIN_EMAIL_FOR_SETLIST_PROXY` in `functions/index.js` |
| Deploy callable | `npm run deploy:functions:phishnet` (root or `functions/`) |

---

## 1. Confirm you are testing the right thing

1. Use a **past** show date. Phish.net may return empty data for **future** dates; failures then look like parser/UI errors, not auth.
2. Confirm **build env**: `VITE_SETLIST_API_SOURCE=phishnet` and `VITE_USE_CALLABLE_PHISHNET_SETLIST=true`. If source is `phishnet` but the callable flag is off, the client shows a **configuration** error by design.

---

## 2. Isolate: Phish.net key vs Firebase vs browser

Run **before** digging into Cloud Run or client code:

```bash
npm run diagnose:phishnet
```

(Works from **repo root** or **`functions/`.)

| Result | Next step |
|--------|-----------|
| **Fails** | Fix or rotate the key at phish.net → update `.env` `PHISHNET_API_KEY` → `npm run secrets:sync-phishnet` → `npm run deploy:functions:phishnet`. |
| **Passes** | Key is valid for direct HTTP. Continue to section 3. |

---

## 3. Secret bound and function deployed

1. Secret exists and matches what you expect: `firebase functions:secrets:access PHISHNET_API_KEY` (or re-run sync from a trusted `.env`).
2. **Redeploy after any secret change** so the revision binds the new secret version: `npm run deploy:functions:phishnet`.
3. Stale deploy is a common cause of “it worked yesterday” — when in doubt, redeploy.

---

## 4. Server-side logs

```bash
firebase functions:log --only getPhishnetSetlist
```

Look for `HttpsError` paths vs unexpected throws. Callable maps many failures to **`failed-precondition`** or **`unavailable`** so the **client** can show a message (see section 6).

---

## 5. Browser: callable error shape

1. Sign in as the **designated admin** (must match the function’s email check).
2. Open DevTools → **Console**. On failure, dev builds log **`[phishApiClient] getPhishnetSetlist callable failed`** with `{ code, message, … }`.
3. Read **`code`** (`unauthenticated`, `permission-denied`, `invalid-argument`, `failed-precondition`, `unavailable`, etc.) — that narrows the layer.

---

## 6. Symptom → likely cause

| What you see | Likely cause | What to do |
|--------------|--------------|------------|
| **CORS** / preflight failure on `cloudfunctions.net` or Cloud Run URL | Gen2 callable behind Cloud Run without public invoker at edge | Ensure `invoker: "public"` on `getPhishnetSetlist` in `functions/index.js`, redeploy. If deploy cannot set IAM, grant **Cloud Run Invoker** for `allUsers` on the **`getphishnetsetlist`** service (README has `gcloud` example). |
| **`FirebaseError: internal`** (generic) | Often **CORS/IAM** (above) or **redacted** `internal` errors from older code paths | Fix CORS first; ensure function uses non-`internal` `HttpsError` codes for user-visible failures; redeploy latest `functions/index.js`. |
| **`unauthenticated`** | Not signed in to Firebase Auth | Sign in; retry. |
| **`permission-denied`** | Signed-in user is not the admin email | Use the gated admin account. |
| **`invalid-argument`** | Bad `showDate` | Must be `YYYY-MM-DD`. |
| **`failed-precondition`** | Missing secret, Phish.net logical error (`error` field in JSON), bad JSON, HTTP error body | Read **message** / logs; run `diagnose:phishnet` if key suspected. |
| **`unavailable`** | Network error calling Phish.net from the function | Transient or DNS/outbound issue; check logs and retry. |
| Setlist “error” despite HTTP 200 | Phish.net returns **`error: false`** for success; logic must not treat that as failure | Fixed in callable + client — ensure deployed revision includes success check for `false` / `0` / `"0"`. |
| Localhost blocked when App Check enforced elsewhere | This callable sets **`enforceAppCheck: false`**; if still blocked, check **Firebase Console → App Check** for your app | Register **debug token** for localhost if needed for other APIs; confirm you are not misreading a different function’s error. |

---

## 7. Ordered checklist (copy for incidents)

1. [ ] Past show date, correct `VITE_*` flags.
2. [ ] `npm run diagnose:phishnet` passes.
3. [ ] `npm run secrets:sync-phishnet` (if key changed) + `npm run deploy:functions:phishnet`.
4. [ ] `firebase functions:log --only getPhishnetSetlist`.
5. [ ] Browser console: admin user + callable `code` / logged payload.
6. [ ] If CORS / generic internal: Cloud Run invoker + redeploy (section 6).

---

## 8. Show calendar sync (issue #160)

| Item | Location / value |
|------|------------------|
| Firestore doc | `show_calendar/snapshot` (read by signed-in clients) |
| Scheduled job | `scheduledPhishnetShowCalendar` — 1st of month 6:00 America/New_York (`0 6 1 * *`) |
| Admin callable | `refreshPhishnetShowCalendar` (same admin email gate as `getPhishnetSetlist`) |
| Upstream | Phish.net v5 `shows/showyear/{year}.json?order_by=showdate` |
| Client | `src/features/show-calendar` → `ShowCalendarProvider` (dashboard route); falls back to `src/shared/data/showDates.js` if the doc is missing |

**Tour / optgroup labels:** See **[docs/SHOW_CALENDAR_TOUR_LABELS.md](SHOW_CALENDAR_TOUR_LABELS.md)** — priority is **`tour_overrides`** → **Phish.net `tour_name`** (when not NPT) → **previous snapshot** → **heuristics**. Seed example: **`scripts/seed/show_calendar_tour_overrides.json`**. **`reviewQueue`** lists **new** dates vs last snapshot. Official **phish.com/tours** names are **not** scraped; use overrides to match the band’s wording when needed.

Deploy with **`npm run deploy:functions:phishnet`** (includes setlist + show-calendar functions). After first deploy, run **`refreshPhishnetShowCalendar`** once as admin (or wait for the schedule) so Firestore is populated.

## 9. Files to touch when changing behavior

- **Callable, secret, invoker, Phish.net URL:** `functions/index.js`
- **Show calendar fetch + grouping:** `functions/phishnetShowCalendar.js`
- **Client region + callable wiring + error extraction:** `src/features/admin-setlist-config/api/phishApiClient.js`
- **Local key smoke test (no Firebase):** `scripts/diagnose-phishnet-local.mjs`
- **Secret sync:** `scripts/sync-phishnet-secret.mjs`

---

## 10. Live-night automation (issue #164)

| Item | Location / value |
|------|------------------|
| Scheduled poller | `scheduledPhishnetLiveSetlistPoll` (`functions/index.js`) |
| Poll cadence | Every 2 minutes, `America/New_York` |
| Target dates | ET today + ET yesterday (`candidateShowDates`) |
| Pause/resume callable | `setLiveSetlistAutomationState` |
| Manual recovery callable | `pollLiveSetlistNow` (forces one poll + one score recompute) |
| Per-show state doc | `live_setlist_automation/{showDate}` |

### Live-night SOP

1. Keep automation **enabled** for active show date in admin panel.
2. Monitor function logs for `live setlist poll cycle` and per-date result (`changed`, `no-change`, `paused`, `backoff`).
3. If API turbulence occurs, exponential backoff is stamped in `live_setlist_automation/{showDate}.nextPollAt`.
4. For incident recovery (stale score or missed update), run **Force poll + score refresh** from admin panel or call `pollLiveSetlistNow`.

### Rollback

1. Pause automation with `setLiveSetlistAutomationState(showDate, false)`.
2. Use existing manual admin flow (**Fetch from API** + **Save Official Setlist**) for the date.
3. Resume automation after incident confirmation.
