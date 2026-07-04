# Changelog

All notable changes to Setlist Pick'em are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  
Public API is declared in [`docs/API.md`](docs/API.md).

---

## [Unreleased]

---

## [1.18.4] — 2026-07-04

### Fixed
- **Safari dashboard perf** — single `AuthProvider` session (no duplicate Firebase auth/profile listeners on profile nav); Profile cluster layout eager-loaded; profile form seeds from the live auth snapshot instead of a redundant Firestore read; FCM foreground messaging deferred until push is enabled; messaging service worker registration deferred until idle.
- **Safari SW update reload** — `clients.claim()` on activate plus a 2s reload fallback so the “Update available → Reload” banner no longer hangs; SW update detection deferred until idle so boot is not blocked.

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
