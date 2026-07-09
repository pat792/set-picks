# Admin picks lock runbook (#522)

Operational guide for **`lockPicksForShowNow`** — the War Room **Lock picks now** button and the `show_lock_state/{showDate}` override path.

---

## 1. Quick reference

| Item | Location / value |
|------|------------------|
| Callable | `functions/index.js` → `exports.lockPicksForShowNow` |
| Core logic | `functions/picksLockOverride.js` → `applyLockPicksForShowNow` |
| Unit tests | `functions/picksLockOverride.test.js` |
| Region | `us-central1` |
| Client hook | `src/features/admin/model/useAdminPicksLock.js` |
| Client API | `src/features/admin/api/picksLockAdminApi.js` |
| UI | `src/features/admin/ui/AdminPicksLockControls.jsx` |
| Firestore doc | `show_lock_state/{YYYY-MM-DD}` |
| Targeted deploy | `firebase deploy --only functions:lockPicksForShowNow` |
| Phishnet bundle deploy | `npm run deploy:functions:phishnet` (includes this callable) |
| Ops CLI (no War Room) | `cd functions && node scripts/lockPicksForShowNow.js --showDate=YYYY-MM-DD` |

---

## 2. How it works

1. Admin clicks **Lock picks now** in War Room while the show is `NEXT`.
2. Client calls `lockPicksForShowNow({ showDate })`.
3. Callable writes `show_lock_state/{showDate}` with `lockReason: admin_override`.
4. All clients subscribed to that doc treat picks as locked even before the 7:55 PM venue-local wall clock.

Idempotent: re-running on an already-stamped doc returns `{ alreadyLocked: true }` without rewriting timestamps.

---

## 3. Deploy checklist (first time + after handler changes)

The frontend ships automatically via Vercel. **The callable does not** — you must deploy it to Firebase.

```bash
# One function only (fastest)
firebase deploy --only functions:lockPicksForShowNow --project set-picks

# Or with the standard phishnet bundle (includes lockPicksForShowNow)
npm run deploy:functions:phishnet
```

Verify in Cloud Logging after clicking the button:

```
jsonPayload.message="lockPicksForShowNow"
```

If nothing appears when you click **Lock picks now**, the function is not deployed or the request never reached Cloud Functions.

---

## 4. Troubleshooting

### `FirebaseError: internal` (opaque, no useful message)

**Most common cause:** `lockPicksForShowNow` is not deployed. Frontend v1.20.0+ shipped the War Room button via Vercel, but the callable only exists after a Firebase deploy.

**Fix:** `firebase deploy --only functions:lockPicksForShowNow --project set-picks`

Also check browser DevTools → Network for a failed POST to `cloudfunctions.net/lockPicksForShowNow` (CORS preflight failures surface as `internal`).

### `permission-denied: Only an admin can perform this action.`

Caller lacks the `admin: true` Firebase custom claim. Grant it on `/admin` via **Grant admin claim to myself**, or see [`docs/ADMIN_CLAIMS_RUNBOOK.md`](./ADMIN_CLAIMS_RUNBOOK.md).

### Button greyed out — no error

- Show is not `NEXT` (already past wall-clock lock, or wrong date selected).
- Admin override is already active (`show_lock_state` doc exists).

### Lock picks tonight without War Room or deploy

**Firebase Console (≈30 seconds):**

1. Firestore → collection `show_lock_state`
2. Add document ID `YYYY-MM-DD` (tonight's show date)
3. Fields:

```json
{
  "showDate": "2026-07-08",
  "lockReason": "admin_override",
  "picksLockedAt": "<Timestamp — now>",
  "lockedBy": "pat@road2media.com"
}
```

Clients pick this up via the real-time listener — no callable deploy required.

**Admin SDK CLI:**

```bash
cd functions
gcloud auth application-default login
node scripts/lockPicksForShowNow.js --showDate=2026-07-08 --lockedBy=pat@road2media.com
```

---

## 5. Related docs

- [`docs/API.md`](./API.md) §1.10 (`show_lock_state`), §2.2b (`lockPicksForShowNow`)
- [`docs/ADMIN_CLAIMS_RUNBOOK.md`](./ADMIN_CLAIMS_RUNBOOK.md) — admin claim bootstrap
- [`docs/PHISHNET_CALLABLE_RUNBOOK.md`](./PHISHNET_CALLABLE_RUNBOOK.md) — phishnet deploy bundle
