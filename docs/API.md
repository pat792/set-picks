# Setlist Pick'em — Public API Declaration

**Version:** 1.28.0  
**SemVer:** https://semver.org  
**Status:** Stable (≥ 1.0.0)

This document is the required public API declaration for Semantic Versioning compliance. Any change to a surface defined here determines the version bump type (MAJOR / MINOR / PATCH) for the next release. Agents and human contributors MUST consult this document before tagging a release.

---

## 1. Firestore Schema

All collections live in the default `(default)` Firestore database for project `set-picks`.

### 1.1 `users/{uid}`

| Field | Type | Notes |
|-------|------|-------|
| `handle` | string | Display name |
| `email` | string | Auth email — used for comms delivery |
| `photoURL` | string? | Legacy optional URL field (unused by curated avatar picker) |
| `avatarId` | string? | **v1.27.0+ (#567)** Curated avatar catalog id (e.g. `ticket`, `flame`). Missing/unknown → default `ticket` |
| `badges` | map? | **v1.28.0+ (#568)** Earned milestone badges `{ [badgeId]: { awardedAt, scope, sourceThroughShow } }`. Written server-side at rollup; idempotent merge |
| `favoriteSong` | string? | Display favorite; empty/`Unknown` treated as unset in UI |
| `termsPrivacyAcceptedAt` | Timestamp? | Legal consent gate |
| `createdAt` | Timestamp | Account creation |
| `isAdmin` | boolean? | Admin custom claim mirror |
| `notificationPrefs` | map | Channel opt-in flags (see §1.2) |
| `totalPoints` | number? | Career graded points (written by `rollupScoresForShow`) |
| `showsPlayed` | number? | Career graded non-empty shows |
| `wins` | number? | Career global night wins (ties share) |
| `careerCorrectSlots` | number? | **v1.26.0+ (#554)** Sum of pick slots that scored > 0 across graded shows. Used for avg correct / show. Absent until rollup/backfill. |
| `seasonStatsThroughShow` | string? | YYYY-MM-DD freshness watermark for materialized career/tour stats |
| `seasonStatsSnapshotAt` | Timestamp? | Last rollup write time |
| `seasonStats.{tourKey}` | map | Per-tour aggregated scoring (`totalPoints`, `shows`, `wins`, and **v1.26.0+** `correctSlots`) |

### 1.2 `users/{uid}` — `notificationPrefs` shape

```json
{
  "lifecycle":   true,
  "liveGame":    true,
  "recap":       true,
  "commercial":  false
}
```

### 1.3 `users/{uid}/private_fcmTokens/{tokenId}`

| Field | Type | Notes |
|-------|------|-------|
| `token` | string | FCM registration token |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |

### 1.4 `users/{uid}/commsInbox/{messageId}`

| Field | Type | Notes |
|-------|------|-------|
| `templateId` | string | Registry key (e.g. `"account-welcome"`) |
| `triggerId` | string | Catalog trigger ID |
| `readAt` | Timestamp? | Null until user opens message |
| `createdAt` | Timestamp | |
| `payload` | map | Template-specific variables |

### 1.5 `pools/{poolId}`

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Pool display name |
| `ownerId` | string | Owner uid |
| `inviteCode` | string | Used in `/join/:code` URLs |
| `members` | string[] | Member uids |
| `createdAt` | string (ISO8601) | Pool create time |
| `status` | `'active' \| 'archived'` | |
| `standingsScope` | `'legacy' \| 'from_membership'`? | **Absent = `legacy`.** New pools write `from_membership` (#417): pool standings count only picks that list this pool in `pick.pools` **and** whose `showDate` is on/after that member’s membership calendar day (`America/Los_Angeles`). Legacy pools keep retroactive carryover + create/join backfill. |
| `memberJoinedAt` | map `{ [uid]: ISO8601 }`? | Per-member join/create anchor for `from_membership` pools. Set for creator on create; updated on join. |

### 1.6 `picks/{pickId}` (subcollection: `pools/{poolId}/picks/{uid}`)

Stores per-user, per-show slot picks and computed scores.

| Field | Type | Notes |
|-------|------|-------|
| `correctSlotsCredited` | number? | **v1.26.0+ (#554)** Slots that scored > 0 on last finalize; used for regrade diffs into `users.careerCorrectSlots` |
| `winCredited` | boolean? | Whether this pick currently counts as a global night win |

### 1.7 `fcm_notification_log/{dedupId}`

Deduplication log shared by all comms channels. Document ID is the `dedupKey` from the trigger spec (e.g. `welcome:{uid}`). Presence of a doc = trigger already delivered; delete to allow re-send.

Also hosts the per-user daily email fatigue cap (#453): doc ID `email_cap:{uid}:{day}` (`day` = `YYYY-MM-DD` in `America/Los_Angeles`), `{ kind: "email_daily_cap", count, cap, lastTriggerId, lastEmailSentAt }`. Written transactionally by `commsEmailDailyCap.js`. `account_welcome` is exempt and never creates one of these docs. Not a new collection — same server-only rules entry as the dedup docs above.

### 1.8 `show_calendar` (singleton or subcollection — see `docs/SHOW_CALENDAR_TOUR_LABELS.md`)

Tour and show date metadata. Read by `resolveCurrentTour` and `resolveSelectableTours`.

### 1.9 `email_suppression/{sha256(email)}`

Server-only email suppression list (issue #442). Document ID is SHA-256 of the normalized recipient address. Presence of `{ suppressed: true }` blocks comms email sends. Written by `commsResendWebhook` and `commsEmailUnsubscribe`.

### 1.10 `show_lock_state/{showDate}` (#522)

Admin picks-lock override. Document ID is the show date (`YYYY-MM-DD`). Written only by the `lockPicksForShowNow` callable (Admin SDK). Clients read during `NEXT` to treat picks as locked before wall-clock or setlist poll signals fire.

| Field | Type | Notes |
|-------|------|-------|
| `showDate` | string | `YYYY-MM-DD` |
| `picksLockedAt` | Timestamp | Lock instant |
| `lockReason` | `'admin_override'` | v1 only writes this value |
| `lockedBy` | string? | Admin email when stamped |

### 1.11 `comms_show_context/{showDate}` (#572)

Server-written night-of narrative artifact for `show_recap` / `tour_rankings_daily`. Document ID is the show date (`YYYY-MM-DD`). Clients have no access. Schema: [`docs/COMMS_SHOW_CONTEXT_SCHEMA.md`](./COMMS_SHOW_CONTEXT_SCHEMA.md).

| Field | Type | Notes |
|-------|------|-------|
| `setlist_highlight` | string? | One-liner for push / Tonight block |
| `set_flow_summary` | string? | Short S1/S2/E structure |
| `bustout_titles` | string[] | From official setlist bustouts |
| `tour_debut_titles` | string[] | New-to-tour titles tonight |
| `show_moment_tags` | string[] | e.g. `bustout`, `tour_debut` |
| `schemaVersion` | number | `1` |

---

## 2. Cloud Function Callables

All callables are in region `us-central1`. Requests must be authenticated Firebase users. Admin-only callables additionally require the `admin` custom claim.

### 2.1 `deliverSphere2026TourRecapInbox` (admin-only)

Delivers the Sphere 2026 tour recap to a set of recipients.

**Request:**
```json
{
  "forceResend": false
}
```

**Response:**
```json
{
  "pushSent": true,
  "pushSentCount": 42,
  "pushSkipReason": null
}
```

### 2.2 `runCommsTrigger` (admin-only)

General-purpose comms delivery callable. Runs a named trigger through the full prefs → dedup → fatigue → render → dispatch pipeline.

**Request:**
```json
{
  "triggerId": "account_welcome",
  "recipients": [{ "uid": "...", "payload": {}, "vars": {} }],
  "dryRun": true,
  "forceResend": false,
  "bypassDailyCap": false
}
```

`bypassDailyCap` (v1.9.0+, admin-only QA) skips the #453 per-user daily email fatigue cap reservation entirely — never set by the production event adapters, only used by this callable so a reviewer can preview every template's rendered email in one sitting (see `scripts/canary-comms-preview.mjs`). `forceResend` bypasses dedup *and* varies the Resend idempotency key (timestamp + random suffix), so repeated QA sends with changed content don't collide with Resend's 24h idempotency window ("request body was modified and doesn't match the original request").

**Response:**
```json
{
  "ok": true,
  "triggerId": "account_welcome",
  "templateId": "account-welcome",
  "dryRun": true,
  "processed": 1,
  "delivered": 1,
  "skipped": 0,
  "byChannel": { "inApp": 0, "push": 0, "email": 0 },
  "results": [
    {
      "uid": "...",
      "status": "would_deliver",
      "channels": ["inApp", "push", "email"],
      "dedupId": "welcome:..."
    }
  ]
}
```

### 2.2a `deliverMarketingSummerTour2026Launch` (admin-only, #468)

Batch marketing email for Summer Tour 2026 pre-opener. Resolves Sphere alum ∪ post-Sphere signup cohort, renders React Email HTML, sends email channel only via Resend. Defaults to dry-run.

**Request:**
```json
{
  "dryRun": true,
  "forceResend": false,
  "onlyUids": ["optional-canary-uid"]
}
```

`onlyUids` limits the cohort to the listed UIDs (canary). `forceResend` bypasses marketing dedup (`marketing:summer_tour_2026:{uid}`). Daily email fatigue cap is bypassed for this batch (`bypassDailyCap: true`).

**Response (dry-run):**
```json
{
  "ok": true,
  "dryRun": true,
  "triggerId": "marketing_summer_tour_2026_launch",
  "campaignId": "summer_tour_2026",
  "cohortSize": 1,
  "sendable": 1,
  "skippedNoEmail": 0,
  "preview": [{ "uid": "...", "segment": "sphere_alum", "handle": "...", "email": "...", "inviteCode": "ABC12" }]
}
```

**Response (execute):** same fields plus `delivery` (orchestrator result: `processed`, `delivered`, `skipped`, `byChannel`, `results`).

CLI: `functions/scripts/deliverMarketingSummerTour2026Launch.js` (`--execute`, `--uid <uid>`, `--force-resend`). Secrets: `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` (Secret Manager on the callable).

### 2.2b `lockPicksForShowNow` (admin-only, #522)

One-click War Room escape hatch: stamps `show_lock_state/{showDate}` so clients lock picks immediately. Idempotent; no setlist or scoring side effects.

**Request:**
```json
{ "showDate": "2026-07-07" }
```

**Response:**
```json
{ "ok": true, "showDate": "2026-07-07", "alreadyLocked": false }
```

When `alreadyLocked` is `true`, the doc already carried `lockReason: admin_override` and the server did not rewrite timestamps.

**Deploy:** `firebase deploy --only functions:lockPicksForShowNow` or `npm run deploy:functions:phishnet`. The War Room button ships via Vercel automatically; the callable does not. See `docs/PICKS_LOCK_ADMIN_RUNBOOK.md`.

**Ops CLI (no War Room):** `cd functions && node scripts/lockPicksForShowNow.js --showDate=YYYY-MM-DD`

### 2.3 `getPhishnetSetlist`, `scheduledPhishnetShowCalendar`, `refreshPhishnetShowCalendar`, `refreshLiveScoresForShow`, `scheduledPhishnetSongCatalog`, `refreshPhishnetSongCatalog`, `scheduledPhishnetLiveSetlistPoll`, `setLiveSetlistAutomationState`, `pollLiveSetlistNow`, `sendPushCanary`

Phish.net integration and live scoring functions. Deployed via `npm run deploy:functions:phishnet`. Internal admin use — request/response shapes documented in `docs/PHISHNET_CALLABLE_RUNBOOK.md`.

**Storage object `song-catalog.json` (v1.25.0+, #554):** published by `scheduledPhishnetSongCatalog` / `refreshPhishnetSongCatalog`. Each song object includes `{ name, total, gap, last, debut }` where `debut` is a string (typically `YYYY-MM-DD`) or `""` when unknown. See `docs/SONG_CATALOG.md`. Adding `debut` is a **MINOR** catalog-field addition (clients may ignore unknown fields).

### 2.4 Comms event adapters (v1.7.0+)

Automated comms delivery triggered by Firestore writes, post-rollup hooks, live-scoring hooks, and scheduled jobs. All adapters route through `deliverCommsTrigger` and are **gated** by `COMMS_EVENT_ADAPTERS_ENABLED=true` (default off).

| Export | Trigger | Event source |
|--------|---------|--------------|
| `commsOnUserProfileWrite` | `account_welcome` | `users/{uid}` write when handle first appears |
| `commsOnPickWrite` | `picks_confirmed` | `picks/{pickId}` create with non-empty picks |
| Post-rollup hook | `show_recap`, `tour_engagement_reminder` | `rollupScoresForShow` completion |
| Live-scoring hook | `score_first_points`, `score_leader` | `recomputeLiveScoresForShow` |
| `scheduledTourCountdownComms` | `tour_countdown` | Daily 9am PT cron (T-10/T-5/T-3/T-1) |
| `scheduledTourRankingsDailyComms` | `tour_rankings_daily` | Daily 8am PT cron (morning-after show) |
| `scheduledPicksLockReminder` | `picks_lock_reminder` | Every 15 min; venue-local show day **T-3h–lock** (16:55–19:54 when lock is 19:55); **not** gated by `COMMS_EVENT_ADAPTERS_ENABLED` (v1.19.0+) |

Trigger specs and channels: `docs/comms-triggers/catalog.json`. Admin canary/replay: `runCommsTrigger` (§2.2).

### 2.5 Comms email deliverability HTTP endpoints (v1.7.1+)

| Export | Method | Auth | Description |
|--------|--------|------|-------------|
| `commsResendWebhook` | POST | Svix signature (`RESEND_WEBHOOK_SECRET`) | Resend bounce/complaint/suppression events → `email_suppression` |
| `commsEmailUnsubscribe` | GET/POST | HMAC query params (`uid`, `email`, `sig`) | RFC 8058 one-click unsubscribe; opts user out of lifecycle email |

Configure the Resend dashboard webhook URL to the deployed `commsResendWebhook` HTTPS endpoint. Signing secret: `firebase functions:secrets:set RESEND_WEBHOOK_SECRET`.

**`commsEmailUnsubscribe` method gating (v1.9.0+, #456):** the two HTTP methods behave differently by design —
- **POST** with a valid signature (the real RFC 8058 one-click action; mail clients issue this automatically via `List-Unsubscribe-Post`) suppresses immediately and returns a success page.
- **GET** with a valid signature (the visible footer "Unsubscribe"/"Manage preferences" link, or any link-scanner/antivirus gateway prefetching it) never suppresses by itself — it renders an HTML confirmation page with a form that must be explicitly submitted (a real POST) to complete the unsubscribe.
- Any other method, or an invalid/missing signature, returns `400`/`405` without touching `email_suppression`.

The branded HTML email body's visible footer link points at the `/dashboard/profile/notifications` Messages settings page, not this endpoint directly — the raw one-click URL is only ever embedded in the invisible `List-Unsubscribe` header. Legacy `/dashboard/notifications` redirects there in the SPA.

### 2.6 Comms email subscription callables (v1.10.0, #455)

Authenticated callables backing the Notifications screen email section. Clients cannot read `email_suppression` directly.

| Export | Auth | Description |
|--------|------|-------------|
| `getCommsEmailStatus` | Signed-in user | Returns `{ hasEmail, suppressed, reason, canResubscribe, message, lifecycleEnabled }` for the caller's account email |
| `unsubscribeCommsEmail` | Signed-in user | Writes `email_suppression` with `reason: user_preferences` and opts out `notificationPrefs.lifecycle` |
| `resubscribeCommsEmail` | Signed-in user | Clears self-serve suppressions (`one_click_unsubscribe`, `user_preferences`) and re-enables `notificationPrefs.lifecycle`; hard bounces and spam complaints are rejected |

---

## 3. Public URL Routes

These routes are part of the public surface. Renaming or removing them is a MAJOR change.

| Path | Auth | Description |
|------|------|-------------|
| `/` | None | Public splash / landing page |
| `/how-it-works` | None | How to play marketing page |
| `/how-scoring-works` | None | Scoring rules marketing page |
| `/join/:code` | None | Pool invite deep link; optional `?from={handle}` for inviter personalization; VIP landing stores code and prompts auth (#580); personalized OG (#582) |
| `/invite/:handle` | None | Site VIP invite deep link; personalized landing when handle resolves; no pool join side effects (#580); personalized OG (#582) |
| `/user/:userId` | None | Public player profile |
| `/privacy` | None | Privacy policy |
| `/terms` | None | Terms of service |
| `/password-reset-complete` | None | Firebase Auth continue URL |
| `/setup` | Auth | Profile setup (new users) |
| `/dashboard/*` | Auth | Full game dashboard |

Dashboard sub-routes are documented in `docs/DASHBOARD_IA.md`.

### 3.1 Email CTA click-through host (`click.setlistpickem.com`)

Service comms email bodies expose **one** tracked CTA link (the teal button). The header wordmark is decorative (CSS background, not a link).

| Host / path | Handler | Description |
|-------------|---------|-------------|
| `https://click.setlistpickem.com/{path}` | Vercel `api/email-click/[[...path]].js` (host rewrite in `vercel.json`) | 302 redirect to `https://www.setlistpickem.com/{path}` with `utm_source=email`, `utm_medium=comms`, and trigger metadata (`utm_campaign` ← `tid`, `utm_content` ← `tpl`, `utm_term` ← `cta`) |

URL builder: `comms/emailLinks.cjs` (`buildEmailTrackedCtaUrl`). Applied at send time in `commsEmailWorker.js`. Ops: add `click.setlistpickem.com` as a Vercel project domain (same deployment as www).

### 3.2 HTTP security headers (Vercel)

Applied via `vercel.json` to all routes. Policy details: `docs/SECURITY_HEADERS.md`.

| Header | Mode | Notes |
|--------|------|-------|
| `X-Content-Type-Options` | Enforce | `nosniff` |
| `Referrer-Policy` | Enforce | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | Enforce | `DENY` on listed app routes only; **omitted** on `/__/auth/*` and `/__/firebase/*` (Vercel does not honor negative-lookahead header sources) |
| `Permissions-Policy` | Enforce | camera/microphone/geolocation disabled |
| `Content-Security-Policy-Report-Only` | Report-only | Flip to `Content-Security-Policy` after soak (promote-day) |

Adding or tightening enforced CSP is MINOR; removing a security header is MAJOR.

### 3.3 Invite landing Open Graph (`api/invite.js`)

Social crawlers (Meta, X, Slack, …) do not execute JavaScript. Invite URLs are rewritten to `api/invite.js`, which injects pool- or inviter-specific OG tags into the SPA shell for browsers and crawlers. If the bundled `dist/index.html` is missing, the function fetches live site `/` HTML as a fallback. Empty crawler-only HTML is never returned to browsers (avoids blank white pages).

| Public path | Rewrite (`vercel.json`) | Query params | Crawler behavior | Browser behavior |
|-------------|-------------------------|--------------|------------------|------------------|
| `/join/:code` | `/api/invite?code=:code` | Unmatched query preserved (e.g. `?from={handle}`) | Resolves pool name via Admin SDK; `from` personalizes title via invite-kit copy | SPA shell + static OG (no Firestore) |
| `/invite/:handle` | `/api/invite?handle=:handle` | — | Resolves `users.handle` via Admin SDK; generic OG if missing | SPA shell + static OG from URL handle |

Copy mirrors `src/shared/lib/inviteKit.js` (`buildSiteInviteShareTitle`, `buildPoolInviteShareTitleFromInviter`) and legacy pool OG (`Join my Setlist Pick 'Em pool: {name}`) when `from` is absent. Constants mirror `src/shared/config/seo.js` in `api/inviteOgHelpers.mjs` (no `src/` imports in serverless).

**Vercel env:** `FIREBASE_SERVICE_ACCOUNT` (JSON) enables Firestore Admin lookups for crawlers.

**Tests:** `api/inviteOgHelpers.test.js` (pure helpers; no Vercel runtime).

---

## 4. Environment Variable Interface

These `VITE_*` variables are read at build time. Adding or removing one is a MINOR (add) or MAJOR (remove/rename) change.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | No | Defaults to `set-picks.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `VITE_GA_MEASUREMENT_ID` | No | GA4 measurement ID (omit locally) |
| `VITE_FCM_VAPID_KEY` | No | Web push VAPID key |
| `VITE_SETLIST_API_SOURCE` | No | Setlist data source override |
| `VITE_USE_CALLABLE_PHISHNET_SETLIST` | No | Route fetches through callable |
| `VITE_SONG_CATALOG_URL` | No | CDN URL override for song catalog |
| `VITE_ENABLE_SPONSOR_SLOTS` | No | `true` renders reserved sponsor/ad placements (`SponsorSlot`); omit to hide (default) |

### 4.1 Cloud Functions runtime env vars

Set in Firebase Functions config or Cloud Secret Manager. Adding one is a MINOR change; removing or renaming is MAJOR.

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | For email channel | Resend API key (Secret Manager); bound to `runCommsTrigger`, `deliverMarketingSummerTour2026Launch`, and comms adapters |
| `RESEND_WEBHOOK_SECRET` | For email deliverability | Resend/Svix webhook signing secret (`whsec_…`); also signs one-click unsubscribe URLs |
| `GA4_MEASUREMENT_ID` | For server `comms_delivered` MP | Same `G-…` id as `VITE_GA_MEASUREMENT_ID`; Functions `defineString` / `.env.set-picks` |
| `GA4_MP_API_SECRET` | For server `comms_delivered` MP | GA4 Measurement Protocol API secret (Secret Manager); bound on all `deliverCommsTrigger` hosts; unset → no-op |
| `COMMS_EVENT_ADAPTERS_ENABLED` | No | Must be `"true"` for v1 event adapters to fire; default off |
| `PHISHNET_API_KEY` | For Phish.net callables | Phish.net API key (Secret Manager) |

---

## 5. Firestore Security Rules Contract

`firestore.rules` enforces access control. Any change that **widens** access (allows previously denied reads/writes) is a MAJOR change. Changes that **narrow** access are MINOR or PATCH.

Current rules version is not independently versioned — it is tied to the app release version. See `firestore.rules` for the canonical contract.

---

## 6. Version Bump Decision Table

| Change | Bump | Examples |
|--------|------|---------|
| Bug fix, copy change, style tweak | **PATCH** | Fix toast wording, fix broken query, UI color |
| New feature, new route, new callable, new env var, new collection | **MINOR** | New comms trigger, new standings view, new marketing page |
| Rename/remove route, rename/remove callable, rename Firestore field, remove env var, widen security rules | **MAJOR** | Rename `commsInbox` → `inbox`, remove `/how-it-works`, break callable request shape |
| Breaking Firestore schema migration | **MAJOR** | Add required field with no default, rename collection |

---

## 7. Release Process

1. Bump `version` in `package.json` per the table above.
2. Add an entry to `CHANGELOG.md` under `## [X.Y.Z] — YYYY-MM-DD`.
3. Open a PR to `staging`, merge, then promote `staging → main`.
4. After the `main` merge: `git tag vX.Y.Z -m "Release X.Y.Z" && git push origin vX.Y.Z`.
5. Update this document if any API surface changed.

---

## 8. Pre-release and Build Metadata

- Pre-release staging builds MAY be tagged `vX.Y.Z-rc.N` (e.g. `v1.7.0-rc.1`).
- Build metadata (e.g. `v1.6.0+sha.abc123`) is informational and does not affect precedence.
- The `staging` branch is treated as a rolling pre-release; only `main` tags carry official version numbers.
