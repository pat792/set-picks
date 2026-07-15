# Changelog

All notable changes to Setlist Pick'em are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  
Public API is declared in [`docs/API.md`](docs/API.md).

---

## [Unreleased]

---

## [1.21.3] — 2026-07-15

### Added
- **Email invite share block (#583)** — Reusable site + pool invite block in React Email (`InviteShareBlock`) and service comms HTML shell; personalized headline + tracked VIP URLs (`/invite/{handle}`, `/join/{code}?from={handle}`) with `utm_source=email`, `utm_campaign`, `utm_content`. Wired into `tour_rankings_daily` lifecycle email and Summer Tour 2026 marketing template (aligned with invite kit copy).

---

## [1.21.2] — 2026-07-15

### Added
- **Standings invite chooser (#581)** — primary **Invite** CTA on dashboard Standings opens a sheet to share a site invite (`/invite/{handle}`) or pick a pool and share `/join/{code}?from={handle}`; empty-state copy wires to the same chooser.

---

## [1.21.1] — 2026-07-15

### Added
- **Invite OG handlers (#582)** — `api/invite.js` serves personalized Open Graph tags for `/invite/:handle` (site VIP) and `/join/:code?from=` (pool inviter); crawlers resolve handle/pool via Firebase Admin; browsers get SPA shell with static OG injection (no Firestore). Rewrites in `vercel.json`.

---

## [1.21.0] — 2026-07-15

### Added
- **VIP invite landings (#580)** — `/invite/:handle` site VIP landing and `/join/:code?from=` pool landing with personalized copy when the inviter handle resolves; full-page auth CTAs (Create account primary, Sign in secondary). Site invites never write pool join storage; pool invites still store `phish_pool_pending_invite` and join after auth via `usePendingPoolJoin`.

---

## [1.20.26] — 2026-07-15

### Added
- **Invite kit (#579)** — `features/invite` public API: site/pool URL + personalized copy builders, `shareInvite` + `invite_share` telemetry; pool share hook consumes the kit (`?from=` when handle provided).

---

## [1.20.25] — 2026-07-15

### Changed
- **Official pick slots** — sixth cell is **Encore 2** (from `encoreSongs[1]`) instead of blank Wildcard; song titles wrap so long names fit.

## [1.20.24] — 2026-07-15

### Fixed
- **Standings mobile sticky nest** — Show/Tour/Pools stick flush under the Standings · Tour Date context bar (tighter top offset; Scoring rules overlays the pill row so it no longer adds a second tier).

---

## [1.20.23] — 2026-07-15

### Added
- **Standings setlist Phish.net credit** — in-card attribution + “see more show details” link to that show’s Phish.net setlist (API ToS attribution; local storage already allowed with refresh).
- **Standings sticky chrome** — desktop sticky stack: Tour Date (when Show/Pools) → Standings title + Show/Tour/Pools pills; content scrolls underneath. Mobile date stays in the fixed context bar.

---

## [1.20.22] — 2026-07-15

### Added
- **Standings live setlist card (#552)** — collapsible set-broken official setlist + six-slot official board (wildcard blank) on Standings; reuses existing `official_setlists` subscription (no extra listeners).

---

## [1.20.21] — 2026-07-15

### Fixed
- **Pool invite Create account (#577)** — `/join/:code` opens the Create account modal (legal checkbox) so new Google joiners avoid the #406 Sign-in dead end; `/?login=true` still opens Sign in; modals switch Create account ↔ Sign in. Join context is a persistent in-modal banner (not a fading toast).

---

## [1.20.20] — 2026-07-15

### Added
- **Auth QA harness (#574)** — `qa:setup`, `qa:auth-scenarios`, `qa:google-signup`, `qa:materialize-env`, and `ga4:auth-funnel` for Cloud Agent / CI investigation of Google and email sign-up failures.
- **Auth telemetry `surface`** — `login` / `sign_up` / `auth_error` emit `surface` (`sign_in` | `create_account`) so Create-account returning Google users are distinguishable from Sign-in modal logins in GA4.

---

## [1.20.19] — 2026-07-15

### Fixed
- **iOS home screen icon** — regenerate `apple-touch-icon.png` from the wordmark PWA manifest asset so Safari matches Chrome’s full wordmark icon; bump favicon cache busters.

---

## [1.20.18] — 2026-07-15

### Fixed
- **iOS Chrome A2HS copy (#539)** — stop claiming Chrome can’t install; teach Share → Add to Home Screen with Chrome steps (toolbar or ··· → Share).

---

## [1.20.17] — 2026-07-14

### Changed
- **Profile boot P0 (#496)** — single `AuthProvider` session listener; `fetchUserProfileDocument` awaits App Check; Profile form seeds from auth `userProfile` (no redundant spinner when warm).

---

## [1.20.16] — 2026-07-14

### Added
- **Email deep-link P0 (#535)** — persist intended dashboard path on unauth redirect; eager App Check on dashboard mount; picks-lock CTA includes `?showDate=`; `comms_email_landed` + `picks_page_interactive` funnel events.

---

## [1.20.15] — 2026-07-14

### Changed
- **PWA-first push disable (#532)** — Messages **Disable** is only shown in standalone/installed context; browser tabs get install/Settings copy instead. Desktop Chrome tabs follow the same rule.

---

## [1.20.14] — 2026-07-14

### Changed
- **A2HS copy by platform (#539)** — Android Chrome / desktop Chromium / iOS Safari lead copy and Safari Share-toolbar steps are shared across the dashboard banner and Profile install card; telemetry uses `android_chrome` / `desktop_chromium` / `ios_safari` / `ios_non_safari`.

---

## [1.20.13] — 2026-07-14

### Added
- **In-app picks CTA honesty (#509)** — `tour_countdown`, `picks_lock_reminder`, and `tour_engagement_reminder` switch to **View / Edit picks** when payload `picks_secured` is true; adapters enrich countdown/engagement from picks for the target show.

---

## [1.20.12] — 2026-07-14

### Fixed
- **Service email mobile typography (#536)** — branded email shell adds viewport meta and bumps body/CTA/footer sizes so Gmail iOS no longer shrinks copy into illegible text.

---

## [1.20.11] — 2026-07-14

### Fixed
- **Safari/PWA standings loading (#507)** — show-scoped standings use React Query (60s stale) so tab revisits skip the full-page spinner; LIVE listeners still apply after snapshot seed; calendar snapshot reference churn no longer restarts the fetch.

---

## [1.20.10] — 2026-07-14

### Fixed
- **Comms CTA / route honesty (#551)** — show recap inbox CTA no longer promises a “full recap” while linking only to standings; labels and destinations aligned (picks → `/dashboard/picks`, recap/score → `/dashboard/standings#self-recap`). Email CTAs and CTA click measurement (`comms_destination`) updated; audit matrix in `docs/comms-triggers/CTA_ROUTE_AUDIT.md`.

---

## [1.20.9] — 2026-07-14

### Fixed
- **Tour countdown multi-tour no-op (#514)** — `scheduledTourCountdownComms` now resolves first-show targets from `showDatesByTour` so past tours on the calendar no longer collapse every show into one pseudo-tour and skip T-10/T-5/T-3/T-1.

---

## [1.20.8] — 2026-07-14

### Fixed
- **Comms venue/location missing from email copy** — `parseShowCalendarSnapshotToShows` was dropping `venue` / `city` / tour fields and only keeping date + timezone, so tour rankings ("Next up: [date]"), lock reminders, picks confirmed, and countdown emails shipped without venue. Parser now preserves location metadata; calendar sync also stores a separate `city` field for subject lines after the next show-calendar refresh.

---

## [1.20.7] — 2026-07-11

### Fixed
- **Admin picks lock deploy gap (#522)** — `lockPicksForShowNow` is now included in `npm run deploy:functions:phishnet`; added `verify:phishnet-deploy-manifest` CI guard, ops CLI (`functions/scripts/lockPicksForShowNow.js`), and `docs/PICKS_LOCK_ADMIN_RUNBOOK.md`. War Room surfaces a clearer error when the callable is missing (`functions/internal`).

---

## [1.20.6] — 2026-07-11

### Fixed
- **Homepage Open Graph / Instagram link previews** — edge middleware serves minimal OG HTML to Meta scrapers on `/`; OG image switched to versioned JPEG (`og-card-1200x630.jpg?v=20260711`) with `og:image:type` and tags moved immediately after charset. Fixes stale Meta cache and maximizes scraper compatibility.
- **Invite link OG handler** — flattened `api/invite.js` (nested `api/invite/[code].js` never registered on Vercel). Crawler UA detection no longer matches the Instagram in-app browser.

---

## [1.20.5] — 2026-07-10

### Changed
- **Picks lock time** — venue-local wall clock moves from **7:55 PM → 7:30 PM** so most shows lock before set 1 and War Room has headroom for manual lock. Reminder window is **T-3h through lock** (16:30–19:29 local); email/in-app copy fallbacks say `7:30 PM`.

### Fixed
- **`tour_rankings_daily` rank change (#544)** — morning tour standings now compute display-rank delta vs the prior show (`up N` / `down N` / `held`) on the **overall tour leaderboard**, so recipients no longer all see "held your spot". Night-one debut, late-joiner catch-up, ties, and leader/top-5 flavor copy are included; regrades recompute from current picks.

---

## [1.20.4] — 2026-07-08

### Fixed
- **Song autocomplete ranking** — pick/admin suggestions now sort by lowest catalog gap, then most times played, and dedupe duplicate Phish.net rows so common titles like **Light** surface in the top 10 instead of being buried by alphabetical catalog order.

---

## [1.20.3] — 2026-07-08

### Fixed
- **Push test notification from hydrated "On"** — "Send test notification" no longer dead-ends with _"token was not freshly rotated in this browser session"_ when push status was restored from a persisted token (the #523 hydration path). The canary now remints the FCM token on-demand (deleteToken + getToken) and re-upserts before sending, preserving the freshly-rotated-token guarantee while removing the need to toggle push off/on first.

---

## [1.20.2] — 2026-07-08

### Fixed
- **Push notification UI hydration** — wait for App Check before reading `private_fcmTokens`, fall back to the browser's live FCM token, and re-sync Firestore when the server pruned a stale doc so Messages no longer shows false "Off" after a prior Enable (#384 follow-up).

---

## [1.20.1] — 2026-07-08

### Changed
- **`account_welcome` copy** — community-focused welcome email and in-app message (pools, tour tracking, spread the word).

### Fixed
- **Comms Functions deploy** — `npm run comms:sync` copies `comms/emailBranding.cjs` and `comms/emailLinks.cjs` into `functions/comms/` at predeploy; deploy validate checks bundled files exist; CI runs sync before functions tests.

---

## [1.20.0] — 2026-07-07

### Added
- **Admin picks lock override (#522)** — War Room **Lock picks now** button; `lockPicksForShowNow` callable writes `show_lock_state/{showDate}`; picks form honors admin lock during `NEXT`.

### Fixed
- **Functions comms bundle paths** — `commsEmailWorker` requires `./comms/*` so new Gen2 deploys (e.g. `lockPicksForShowNow`) load inside the Cloud Run `/workspace` bundle.

---

## [1.19.0] — 2026-07-07

### Added
- **`picks_lock_reminder` email + in-app** (#524) — migrate show-day lock fanout to `deliverCommsTrigger`; audience is users with a handle and no picks for tonight's show; transactional email bypasses `reminders` pref and daily cap.
- **Email CTA click tracking** — `click.setlistpickem.com` → `api/email-click` redirect with UTM params; `comms/emailLinks.cjs`; wired in `commsEmailWorker` at send time.

### Changed
- **Comms email classification** — `emailClass: transactional` on `picks_lock_reminder`; channel-aware prefs in `commsDelivery` (push/in-app still honor `reminders`); transactional emails omit marketing `List-Unsubscribe` headers.
- **Notifications UI copy** — clarify that show-day pick reminder emails are service notices, separate from the Tour & onboarding email toggle.
- **Service email shell** — wordmark is decorative (CSS background, not a link); body CTA is the only in-body link.

### Fixed
- **Service email wordmark** — bare hosted `<img>` let clients open the raw PNG on tap; header is now non-clickable.
- **Email click API route** — Vercel did not deploy nested `api/email-click/[[...path]].js`; use flat `api/email-click.js` + query rewrite so `click.setlistpickem.com` 302s correctly.

---

## [1.18.8] — 2026-07-05

### Changed
- **Dependabot re-enabled (#504)** — restore `open-pull-requests-limit` to 5/5/3 after v1.18 enablement-wave ops reset; triage per `docs/DEPENDABOT_OPERATIONS.md`.
- **Email branding (#498)** — keep large vinyl in-body logo (`web-app-manifest-512x512.png`); centralize URLs in `comms/emailBranding.cjs`; document inbox sender badge (BIMI/DMARC) separately from in-body HTML.
- **Service comms email shell** — gradient wordmark via hosted `/branding/email-gradient-wordmark.png` (marketing-email pattern; no CID/data URIs); teal CTA + top accent per `design.md`; warm sign-off; `assembleServiceEmail()` copy contract; production-fidelity preview via `--send`.
- **In-app comms CTAs** — `tour-countdown` and `tour-engagement-reminder` use contextual picks deep links instead of generic “Open the app”; document in-app vs push/email CTA rules in `TRIGGER_CATALOG.md`.

### Added
- **`comms/emailBranding.cjs`** — shared in-body email logo URL helper.
- **`comms/email-gradient-wordmark.png`** + **`public/branding/email-gradient-wordmark.{png,svg}`** — email-cropped gradient wordmark; regenerate via `npm run generate:email-wordmark`.
- **`functions/tourCountdownRecoveryDelivery.js`** + **`functions/scripts/deliverTourCountdownRecovery.js`** — manual T-1 recovery batch when cron misses (#514).
- **`docs/comms-triggers/EMAIL_INBOX_BADGE.md`** — runbook for inbox sender badge (BIMI/DMARC) vs in-body logo (#498).
- **`scripts/send-local-email-preview.mjs`** — local Resend preview helper for branded email shells.
- **`scripts/generate-email-wordmark.mjs`** — rasterize SVG wordmark for email + Functions bundle.
- **`vercel.json`** — rewrite `/favicon.ico` → `/favicon/favicon.ico` for domain-root favicon fetchers.

### Fixed
- **Tour-countdown email** — venue line dedup when city is already in venue string; `Make Your Picks` CTA to `/dashboard/picks`.

---

## [1.18.7] — 2026-07-04

### Fixed
- **Standings "Checking your picks…" spinner stuck on Safari** — derive next-show pick status from the standings picks query instead of a redundant `getDoc`; harden `useNextShowPicksStatus` against effect cancellation races (Pools / Pool Hub).

---

## [1.18.6] — 2026-07-04

### Fixed
- **Safari dashboard tab navigation** — stop remounting the lazy route tree on every `/dashboard/*` pathname change (`shellTransitionKey` in `RootAppShell`); static-import primary nav tabs (Picks, Pools, Standings, Profile) so tab switches never hit Suspense; keep Admin / Pool Hub / Account / Messages lazy with per-route boundaries and eager prefetch on dashboard mount.

---

## [1.18.5] — 2026-07-04

### Fixed
- **PR queue stabilization** — pause Dependabot (`open-pull-requests-limit: 0`) after v1.18 enablement-wave; add Vercel `ignoreCommand` to skip SPA previews for CI/functions-only dependency PRs.

### Added
- **`docs/DEPENDABOT_OPERATIONS.md`** — definitive enablement timeline, agent triage table, ops-reset procedure, re-enable checklist.

---

## [1.18.4] — 2026-07-04

### Fixed
- **Vercel build time** — drop explicit `npm ci` install command so Vercel restores its dependency cache (`up to date in 1s`) instead of reinstalling 685 packages (~2 min). `.npmrc` `legacy-peer-deps` retains the v1.18.1 peer-resolution fix.

### Changed
- **Dependabot CI** — auto-apply `skip-version-bump` label and exempt `dependabot/*` branches from the SemVer gate (dependency-only PRs do not bump `package.json`).

---

## [1.18.3] — 2026-07-04

### Fixed
- **Auth iframe headers (Vercel)** — replace unsupported negative-lookahead `X-Frame-Options` route with explicit app-route allowlist plus dedicated `/__/auth/*` and `/__/firebase/*` header blocks. v1.18.2 regex still applied `DENY` to Firebase Auth proxy paths on Vercel.

---

## [1.18.2] — 2026-07-04

### Fixed
- **Google / email sign-in regression (#412 follow-up)** — `X-Frame-Options: DENY` no longer applies to Firebase Auth proxy routes (`/__/auth/*`, `/__/firebase/*`). The catch-all header from v1.16.0 blocked Auth helper iframes on the custom `www.setlistpickem.com` domain, causing `auth/popup-closed-by-user` ("Sign-in was cancelled") and hung email sign-in.
- **Marketing `/join/:code` cold starts** — the invite OG serverless handler skips Firestore for regular browsers; only social crawlers pay the Admin lookup.

---

## [1.18.1] — 2026-07-03

### Fixed
- **Vercel install** — pin `firebase@10.14.1`, add `overrides` + `.npmrc` `legacy-peer-deps`, and `npm ci` install command so `@firebase/rules-unit-testing` peer resolution no longer fails on deploy.

---

## [1.18.0] — 2026-07-03

### Added
- **Pool read caps (#415)** — pool hub loads members via `pool.members` (capped at 100); user pool lists capped at 50 (`MAX_POOL_MEMBERS_FETCH` / `MAX_USER_POOLS_FETCH`).
- **Live grading early-exit (#416)** — `gradePicksOnSetlistWrite` skips the full picks scan when the playable scoring setlist is unchanged (metadata-only writes).

---

## [1.17.0] — 2026-07-03

### Added
- **Versioned Firestore indexes (#413)** — `firestore.indexes.json` wired in `firebase.json` (exported baseline from prod; currently no composites).
- **Dependabot + informational npm audit (#414)** — weekly npm updates for root and `functions/`, monthly Actions; CI audit step is non-blocking. Triage notes in `AGENTS.md`.

---

## [1.16.0] — 2026-07-03

### Added
- **Security headers + CSP Report-Only (#412)** — `vercel.json` sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, and `Content-Security-Policy-Report-Only` (Firebase, GA4, reCAPTCHA Enterprise, Google Fonts, Phish.in). Documented in `docs/SECURITY_HEADERS.md`; enforce flip is promote-day after report-only soak.

---

## [1.15.0] — 2026-07-03

### Added
- **Server `comms_delivered` → GA4 Measurement Protocol (#461)** — `functions/commsGa4Measurement.js` posts per-channel delivery events (params match client `comms_*` dimensions) from `deliverCommsTrigger` on real sends. Gated by `GA4_MEASUREMENT_ID` + `GA4_MP_API_SECRET`, prod project, and non-emulator.

---

## [1.14.0] — 2026-07-03

### Added
- **Visible pool invite code** — pool details, pool cards, and post-create success show the invite code with a one-tap **Copy** control for in-person sharing.

### Changed
- Invite share clipboard and Open Graph copy use **“Join my Setlist Pick 'Em pool”** wording (pool name included when known). Native share remains URL-only so iMessage can still fetch OG.

---

## [1.13.0] — 2026-07-03

### Added
- **Profile cluster IA (#418 Phase 1)** — nested routes under `/dashboard/profile` with sub-nav **Profile** / **Messages** / **Account**; `ProfileClusterLayout`, `AccountPage`, and `features/account` (moved account security + delete from `features/profile`). Avatar shortcut → Account; bell → Messages.
- **Legacy redirects** — `/dashboard/notifications` → `/dashboard/profile/notifications` and `/dashboard/account-security` → `/dashboard/profile/account` (query string preserved).

### Changed
- Comms/email/push deep links and unsubscribe footer targets use `/dashboard/profile/notifications`.
- Dashboard last-path restore excludes the entire Profile cluster.

---

## [1.12.0] — 2026-07-03

### Added
- **Pool standings from membership (#417)** — new pools write `standingsScope: 'from_membership'` and `memberJoinedAt.{uid}`; pool-scoped standings (hub + Standings Pools filter) count only picks that list the pool and whose `showDate` is on/after that member’s join day (`America/Los_Angeles`). Existing pools (no field) keep legacy retroactive carryover and create/join backfill.

### Changed
- `deletePoolWithCleanup` activity scan honors `from_membership` so pre-join legacy pick docs do not block delete on new-mode pools.

---

## [1.11.0] — 2026-07-03

### Added
- **Summer Tour 2026 pre-opener marketing email (#468)** — admin batch send for Sphere alum + post-Sphere signups via React Email (`emails/`), `deliverMarketingSummerTour2026Launch` callable/CLI (dry-run default, optional `onlyUids` canary), share CTA uses `/join/:code` invite OG links when the recipient has a pool. Prefs key `lifecycle`; dedup `marketing:summer_tour_2026:{uid}`.

### Fixed
- **Localhost App Check** — dev mode uses the registered debug token UUID instead of minting an unregistered random token (`true`), so Google sign-in and Firestore work on `localhost` without manual IndexedDB seeding.

---

## [1.10.2] — 2026-07-02

### Added
- **`tour_countdown` T-3 reminder (#463)** — daily 9am PT cron now fires when a tour's first show is exactly 3 days away (in addition to T-10, T-5, T-1). Summer Tour 2026 (Jul 7 kickoff) sends on Jul 4.

---

## [1.10.1] — 2026-07-02

### Fixed
- **Live-scoring and post-rollup email channel** — bind `RESEND_API_KEY` / `RESEND_WEBHOOK_SECRET` on `gradePicksOnSetlistWrite`, `rollupScoresForShow`, `refreshLiveScoresForShow`, `scheduledPhishnetLiveSetlistPoll`, and `pollLiveSetlistNow` so comms event adapters can send email (inApp/push already worked; email skipped without secret injection). Closes #460.

---

## [1.10.0] — 2026-07-02

Bundled comms phase-1 release to production: rolls up staging-only increments 1.7.1–1.9.0 plus #455 email preferences UI. Main was at 1.7.0 (event adapters, gated off). `COMMS_EVENT_ADAPTERS_ENABLED` remains off until post-deploy canary (#438).

### Added
- **Resend deliverability (#442)** — `commsResendWebhook` (bounce/complaint/suppression → `email_suppression`), `commsEmailUnsubscribe` (RFC 8058 one-click), email worker suppression gate
- **Firestore** — `email_suppression/{sha256(email)}` server-only collection
- **Per-user daily email fatigue cap (#453)** — at most one discretionary email per user per `America/Los_Angeles` day, enforced transactionally via `email_cap:{uid}:{day}` inside `fcm_notification_log`. `account_welcome` is exempt. New `comms_capped` structured log event (Cloud Logging, not yet GA4 — see epic #441).
- **Branded HTML email body (#456)** — comms email sends a branded `html` part (logo, CTA button, footer with "Manage preferences"/"Unsubscribe" links) alongside plain-text fallback. Body copy renders as a single `<p>` with `<br>` line breaks (avoids Gmail content-folding quirk).
- **`bypassDailyCap` (admin-only, `runCommsTrigger`)** — skips the #453 daily cap for QA template preview runs. See `scripts/canary-comms-preview.mjs`.
- **Push notification click-through** — `firebase-messaging-sw.js` handles `notificationclick`, focusing an existing app window or opening the deep link.
- **Notifications email preferences UI (#455)** — Email accordion on `/dashboard/notifications` shows lifecycle email status, suppression reason, and unsubscribe / re-enable actions. "Tour & onboarding updates" copy now states it applies to push, in-app, and email.
- **Comms email subscription callables (#455)** — `getCommsEmailStatus`, `unsubscribeCommsEmail`, `resubscribeCommsEmail` (clients cannot read `email_suppression` directly). Self-serve resubscribe clears `one_click_unsubscribe` and `user_preferences` suppressions; hard bounces and spam complaints stay blocked.
- `functions/commsEmailUnsubscribe.test.js`, `functions/commsEmailPrefs.test.js` — unit coverage for unsubscribe and prefs callables.

### Changed
- Comms email `List-Unsubscribe` headers include signed one-click unsubscribe URLs when `RESEND_WEBHOOK_SECRET` is set
- **Comms fatigue reduction (#451)** — `show_recap` no longer emails; recap content folded into `tour_rankings_daily`'s next-morning email. `inApp`/`push` unchanged.
- Fixed stale `tour_rankings_daily` schedule description in `docs/comms-triggers/` (documented as "10:00 AM ET"; actual cron is 8:00 AM `America/Los_Angeles`)
- **Known daily-cap limitation:** first-reservation-wins per day — morning crons (`tour_rankings_daily`, `tour_countdown`) usually win over evening `tour_engagement_reminder`.
- **`forceResend` (`runCommsTrigger`)** varies the Resend `idempotencyKey` (timestamp + random suffix) in addition to bypassing dedup.
- Branded HTML body no longer repeats the plain-text "Open the app: `<url>`" line (HTML has its own CTA).
- **`commsEmailUnsubscribe` method gating (#456):** POST suppresses immediately (RFC 8058 one-click); GET renders a confirmation form (link-scanner safe); other methods return `405`.
- Branded HTML footer "Unsubscribe" link points at `/dashboard/notifications`; raw one-click URL is only in the `List-Unsubscribe` header.

### Fixed
- Executed the #453 daily-cap manual test plan: two non-exempt triggers same day → first sends, second capped with `comms_capped` logging.

---

## [1.7.0] — 2026-06-30

### Added
- **Comms v1 event adapters** — thin Firestore/scheduler hooks for all 8 planned triggers: `account_welcome`, `picks_confirmed`, `show_recap`, `tour_engagement_reminder`, `score_first_points`, `score_leader`, `tour_countdown`, `tour_rankings_daily` (issue #440, PR #448)
- **New Cloud Functions:** `commsOnUserProfileWrite`, `commsOnPickWrite`, `scheduledTourCountdownComms`, `scheduledTourRankingsDailyComms`; post-rollup and live-scoring hooks in `rollupCore.js` / `recomputeLiveScoresForShow`
- **`COMMS_EVENT_ADAPTERS_ENABLED`** runtime gate — adapters no-op unless set to `true` (default off; enable after canary)

### Changed
- Comms trigger catalog: all 8 v1 triggers marked `shipped` in `catalog.json` + `TRIGGER_CATALOG.md`

---

## [1.6.0] — 2026-06-28

### Added
- **Comms delivery substrate** — generalized `runCommsTrigger` callable, channel workers (inApp, push, Resend email), catalog resolver, and fatigue/dedup pipeline (epic #441/#442)
- **Comms frontend substrate** — multi-template inbox renderer, dev preview gallery (`/dev/comms-preview`), measurement analytics (`comms_opened`, `comms_cta`, `push_tap`, `pref_changed`)
- **`notificationPrefs` keys** — `lifecycle` and `commercial` preference toggles with UI
- **Comms automation framework docs** — TTDMOM framework, ECOSYSTEM.md, fully-automated event-driven architecture

### Changed
- `functions/index.js` — adds `runCommsTrigger` export and `RESEND_API_KEY` secret binding

---

## [1.5.0] — 2026-06-22

### Added
- **Comms squad scaffold** — TTDMOM framework, 9 trigger catalog entries, templates, Cursor squad skills (PR #428)

---

## [1.4.0] — 2026-06-22

### Added (Sprint 5 — Growth & Engagement)
- **Dynamic OG tags** for `/join/:code` invite links via Vercel Serverless Function and Firebase Admin SDK (issue #128, PR #436)
- **SEO marketing routes** `/how-it-works` and `/how-scoring-works` with JSON-LD schemas; sitemap.xml and llms.txt updated; splash footer links (issue #339, PR #434)
- **Past-tours picker** for global standings and pool hub — `TourPicker` component, `useStandingsTourSelection` URL hook, `resolveSelectableTours`/`getTourByKey` helpers with 17 unit tests (issue #295, PR #433)
- **Setlist lock toast** fires once on `NEXT→LIVE` transition (issue #120, PR #432)
- **Profile update confirmation toast** on successful `saveProfile` (issue #120, PR #432)
- **Firebase Auth email templates runbook** (`docs/FIREBASE_AUTH_EMAIL_TEMPLATES.md`) (issue #120, PR #432)
- **SW update UX** — `useServiceWorkerUpdate` hook + `UpdateAvailableBanner` wired into app shell; `SKIP_WAITING` message handler in FCM service worker; strategy decision documented (issue #383, PR #431)

### Fixed
- **Push notification UI hydration** — `usePushTokenRegistration` now reads Firestore on mount when `Notification.permission === 'granted'`, preventing false "Off" state (issue #384, PR #430)
- **Recap push copy alignment** — `sendRecapPushFanout` now uses same personalized title/body as admin preview (issue #384, PR #430)
- **Recap resend visibility** — callable now returns `pushSent`, `pushSentCount`, `pushSkipReason`; `forceResend` parameter bypasses dedup (issue #384, PR #430)

---

## [1.3.0] — 2026-05-16

### Added (Sprint 4 — Pool Lifecycle and Growth)
- Pool hub standings section with All-time / Tour toggle
- Materialized pool standings reads from `users.{uid}.seasonStats.{tourKey}`
- Tour-scoped global standings via `useTourStandings`
- Pool lifecycle management (create, join, leave flows)
- Auth telemetry for partial-profile orphan detection (PR #402)
- `createdAt` resilience + orphan repair (PR #404)
- Sign-in modal new-user block with consent enforcement (PR #406)
- Splash Google modal UX fixes (PR #410)

---

## [1.2.0] — 2026-05-02

### Added (Sprint 3 — Live-Night Foundation continued)
- Live scoring hooks: `score_first_points`, `score_leader` triggers
- Bustout boost tier table (30+ show gap bonus scoring)
- Post-show rollup recovery admin tooling
- Public player profile page (`/user/:userId`)
- Password reset complete flow (`/password-reset-complete`)

---

## [1.1.0] — 2026-04-18

### Added (Sprint 2 — Live-Night Foundation)
- Live setlist polling + real-time score updates
- Show calendar provider and tour resolution logic (`resolveCurrentTour`)
- FCM web push foundation: service worker, VAPID, token storage (issue #273)
- Push notifications feature: opt-in UI, channel prefs, profile entry (issue #274)
- Legal consent gate: Terms / Privacy acceptance at signup
- Firestore security rules for `private_fcmTokens` and `commsInbox`

---

## [1.0.0] — 2026-04-04

### Added (Sprint 1 — Architecture & UI)
- Initial production release
- Vite + React 18 SPA with Firebase Auth (email/password + Google OAuth)
- Firestore data model: `users`, `pools`, `picks`, `show_calendar`
- Global standings (`/dashboard/standings`)
- Pool hub (`/dashboard/pool/:id`)
- Pick submission UI with slot picker and song autocomplete
- Phish.net API integration via Firebase Callable (epic #42)
- Song catalog CDN delivery
- Vercel hosting with App Check, immutable asset caching
- FSD (Feature-Sliced Design) architecture enforced via ESLint import boundaries
- CI matrix: lint + vitest + dashboard-meta + dashboard-ui + Vercel preview

---

[Unreleased]: https://github.com/pat792/set-picks/compare/v1.10.0...HEAD
[1.10.0]: https://github.com/pat792/set-picks/compare/v1.7.0...v1.10.0
[1.7.0]: https://github.com/pat792/set-picks/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/pat792/set-picks/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/pat792/set-picks/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/pat792/set-picks/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/pat792/set-picks/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/pat792/set-picks/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/pat792/set-picks/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/pat792/set-picks/releases/tag/v1.0.0
