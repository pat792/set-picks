# Setlist Pick'em — Public API Declaration

**Version:** 1.7.0  
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
| `photoURL` | string? | Avatar URL |
| `termsPrivacyAcceptedAt` | Timestamp? | Legal consent gate |
| `createdAt` | Timestamp | Account creation |
| `isAdmin` | boolean? | Admin custom claim mirror |
| `notificationPrefs` | map | Channel opt-in flags (see §1.2) |
| `seasonStats.{tourKey}` | map | Per-tour aggregated scoring |

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
| `hostUid` | string | Owner uid |
| `inviteCode` | string | Used in `/join/:code` URLs |
| `memberUids` | string[] | |
| `createdAt` | Timestamp | |

### 1.6 `picks/{pickId}` (subcollection: `pools/{poolId}/picks/{uid}`)

Stores per-user, per-show slot picks and computed scores.

### 1.7 `fcm_notification_log/{dedupId}`

Deduplication log shared by all comms channels. Document ID is the `dedupKey` from the trigger spec (e.g. `welcome:{uid}`). Presence of a doc = trigger already delivered; delete to allow re-send.

### 1.8 `show_calendar` (singleton or subcollection — see `docs/SHOW_CALENDAR_TOUR_LABELS.md`)

Tour and show date metadata. Read by `resolveCurrentTour` and `resolveSelectableTours`.

### 1.9 `email_suppression/{sha256(email)}`

Server-only email suppression list (issue #442). Document ID is SHA-256 of the normalized recipient address. Presence of `{ suppressed: true }` blocks comms email sends. Written by `commsResendWebhook` and `commsEmailUnsubscribe`.

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
  "forceResend": false
}
```

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

### 2.3 `getPhishnetSetlist`, `scheduledPhishnetShowCalendar`, `refreshPhishnetShowCalendar`, `refreshLiveScoresForShow`, `scheduledPhishnetSongCatalog`, `refreshPhishnetSongCatalog`, `scheduledPhishnetLiveSetlistPoll`, `setLiveSetlistAutomationState`, `pollLiveSetlistNow`, `sendPushCanary`

Phish.net integration and live scoring functions. Deployed via `npm run deploy:functions:phishnet`. Internal admin use — request/response shapes documented in `docs/PHISHNET_CALLABLE_RUNBOOK.md`.

### 2.4 Comms event adapters (v1.7.0+)

Automated comms delivery triggered by Firestore writes, post-rollup hooks, live-scoring hooks, and scheduled jobs. All adapters route through `deliverCommsTrigger` and are **gated** by `COMMS_EVENT_ADAPTERS_ENABLED=true` (default off).

| Export | Trigger | Event source |
|--------|---------|--------------|
| `commsOnUserProfileWrite` | `account_welcome` | `users/{uid}` write when handle first appears |
| `commsOnPickWrite` | `picks_confirmed` | `picks/{pickId}` create with non-empty picks |
| Post-rollup hook | `show_recap`, `tour_engagement_reminder` | `rollupScoresForShow` completion |
| Live-scoring hook | `score_first_points`, `score_leader` | `recomputeLiveScoresForShow` |
| `scheduledTourCountdownComms` | `tour_countdown` | Daily 9am PT cron (T-10/T-5/T-1) |
| `scheduledTourRankingsDailyComms` | `tour_rankings_daily` | Daily 8am PT cron (morning-after show) |

Trigger specs and channels: `docs/comms-triggers/catalog.json`. Admin canary/replay: `runCommsTrigger` (§2.2).

### 2.5 Comms email deliverability HTTP endpoints (v1.7.1+)

| Export | Method | Auth | Description |
|--------|--------|------|-------------|
| `commsResendWebhook` | POST | Svix signature (`RESEND_WEBHOOK_SECRET`) | Resend bounce/complaint/suppression events → `email_suppression` |
| `commsEmailUnsubscribe` | GET/POST | HMAC query params (`uid`, `email`, `sig`) | RFC 8058 one-click unsubscribe; opts user out of lifecycle email |

Configure the Resend dashboard webhook URL to the deployed `commsResendWebhook` HTTPS endpoint. Signing secret: `firebase functions:secrets:set RESEND_WEBHOOK_SECRET`.

---

## 3. Public URL Routes

These routes are part of the public surface. Renaming or removing them is a MAJOR change.

| Path | Auth | Description |
|------|------|-------------|
| `/` | None | Public splash / landing page |
| `/how-it-works` | None | How to play marketing page |
| `/how-scoring-works` | None | Scoring rules marketing page |
| `/join/:code` | None | Pool invite deep link |
| `/user/:userId` | None | Public player profile |
| `/privacy` | None | Privacy policy |
| `/terms` | None | Terms of service |
| `/password-reset-complete` | None | Firebase Auth continue URL |
| `/setup` | Auth | Profile setup (new users) |
| `/dashboard/*` | Auth | Full game dashboard |

Dashboard sub-routes are documented in `docs/DASHBOARD_IA.md`.

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

### 4.1 Cloud Functions runtime env vars

Set in Firebase Functions config or Cloud Secret Manager. Adding one is a MINOR change; removing or renaming is MAJOR.

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | For email channel | Resend API key (Secret Manager); bound to `runCommsTrigger` and comms adapters |
| `RESEND_WEBHOOK_SECRET` | For email deliverability | Resend/Svix webhook signing secret (`whsec_…`); also signs one-click unsubscribe URLs |
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
