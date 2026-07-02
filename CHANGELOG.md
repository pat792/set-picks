# Changelog

All notable changes to Setlist Pick'em are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  
Public API is declared in [`docs/API.md`](docs/API.md).

---

## [Unreleased]

---

## [1.8.0] — 2026-07-02

### Added
- **Per-user daily email fatigue cap (#453)** — at most one discretionary email per user per `America/Los_Angeles` day, enforced transactionally via a new `email_cap:{uid}:{day}` doc-id shape inside the existing `fcm_notification_log` collection (no new collection/rules entry). Checked in `commsEmailWorker.js` after the suppression check, before the real Resend send; fails open on transaction errors so a Firestore hiccup can never silently swallow a legitimate email.
- `account_welcome` is exempt from the cap (one-time-ever send, can't cause fatigue).
- New `comms_capped` structured log event (Cloud Logging, not yet GA4 — see epic #441) fired when a trigger's email is skipped due to the cap.

### Changed
- **Known limitation:** the cap is first-reservation-wins (whichever trigger's email worker runs first that day keeps the slot) rather than a true priority queue — a higher-value trigger firing later in the day cannot preempt an already-sent lower-value one, since an email can't be unsent. In practice this means the two morning crons (`tour_rankings_daily` 8am PT, `tour_countdown` 9am PT) will usually win over the evening-firing `tour_engagement_reminder` on a contested day. Revisit if `comms_capped` data shows this ordering is hurting engagement.

---

## [1.7.2] — 2026-07-02

### Changed
- **Comms fatigue reduction (#451)** — `show_recap` no longer emails; its "your night" recap content (score, rank) is folded into `tour_rankings_daily`'s next-morning email instead. Eliminates the dominant same-day email collision (both triggers previously fired for the same `(uid, showDate)` on every single-tour-night). `inApp`/`push` channels are unchanged — night-of delivery still fires immediately from `show_recap`.
- Fixed stale `tour_rankings_daily` schedule description in `docs/comms-triggers/` (documented as "10:00 AM ET"; actual `onSchedule` cron is 8:00 AM `America/Los_Angeles`)

---

## [1.7.1] — 2026-06-30

### Added
- **Resend deliverability (#442)** — `commsResendWebhook` (bounce/complaint/suppression → `email_suppression`), `commsEmailUnsubscribe` (RFC 8058 one-click), email worker suppression gate
- **Firestore** — `email_suppression/{sha256(email)}` server-only collection

### Changed
- Comms email `List-Unsubscribe` headers now include signed one-click unsubscribe URLs when `RESEND_WEBHOOK_SECRET` is set

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

[Unreleased]: https://github.com/pat792/set-picks/compare/v1.8.0...HEAD
[1.8.0]: https://github.com/pat792/set-picks/compare/v1.7.2...v1.8.0
[1.7.2]: https://github.com/pat792/set-picks/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/pat792/set-picks/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/pat792/set-picks/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/pat792/set-picks/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/pat792/set-picks/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/pat792/set-picks/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/pat792/set-picks/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/pat792/set-picks/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/pat792/set-picks/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/pat792/set-picks/releases/tag/v1.0.0
