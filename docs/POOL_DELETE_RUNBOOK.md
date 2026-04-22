# Pool delete runbook

Operational guide for **`deletePoolWithCleanup`** (Firebase HTTPS callable → Admin SDK). Introduced in issue [#138](https://github.com/pat792/set-picks/issues/138) under EPIC [#127](https://github.com/pat792/set-picks/issues/127) (Pool admin & lifecycle).

This is the server-side replacement for the old client-only "owner-alone, no picks" delete path. The server is now the **source of truth** for delete eligibility and is the only component that can clear `poolId` from every member's `users.pools` array (Firestore rules keep cross-user writes admin-only).

---

## 1. Quick reference

| Item | Location / value |
|------|------------------|
| Callable | `functions/index.js` → `exports.deletePoolWithCleanup` |
| Helpers + walk | `functions/poolDelete.js` |
| Unit tests | `functions/poolDelete.test.js` (run via `cd functions && npm test`) |
| Region | `us-central1` |
| Client wrapper | `src/features/pools/api/poolDeleteCallable.js` |
| Orchestration | `src/features/pools/model/usePoolAdminControls.js` (`handleConfirmDelete`) |
| UI surface | `src/features/pools/ui/PoolAdminControls.jsx` (**Delete pool** button + `ConfirmationModal`) |
| Targeted deploy | `firebase deploy --only functions:deletePoolWithCleanup` |

---

## 2. Contract

`deletePoolWithCleanup({ poolId: string })`

**Authorization:**
- Caller must be signed in (`unauthenticated` otherwise).
- `request.auth.uid` must equal `pools/{poolId}.ownerId` (`permission-denied` otherwise).

**Preconditions:**
- `poolId` is a non-empty string (`invalid-argument` otherwise).
- `pools/{poolId}` exists (`not-found` otherwise).
- **No qualifying pick activity** for any member across the scheduled calendar (`failed-precondition` with "Archive instead of deleting." otherwise).

**Activity rule (mirrors client `pickDocHasPoolActivity`):**
A pick doc `picks/{showDate}_{uid}` counts as activity iff it counts for this pool (no embedded `pools` array, or array contains `{ id: poolId }`) AND any of: non-empty `picks` object, `isGraded === true`, or `score > 0`.

**Show date source:** `show_calendar/snapshot` (same doc the client reads). Parsed via `parseShowCalendarDates` — accepts both the `showDatesByTour` v2 shape and a legacy `showDates: string[]` shape. If the snapshot is missing, the walk short-circuits to "no activity" — do **not** deploy delete before the calendar has been seeded.

**Success path:**
1. Batched `FieldValue.arrayRemove(poolId)` on every member's `users/{uid}` doc (split at the Firestore 500-write batch limit).
2. `pools/{poolId}` deleted in the same logical operation as the final member batch.
3. Returns `{ ok: true, poolId, memberUpdates }` where `memberUpdates` is the number of `users` docs touched (always ≥ 1 — the owner is force-included even if missing from `members`).
4. Structured audit log in Cloud Logging: `jsonPayload.message="deletePoolWithCleanup"` with `{ poolId, callerUid, memberUpdates }`.

---

## 3. Client error mapping

`poolDeleteCallable.js` normalizes the `HttpsError` `code` into a stable `err.code` the orchestrator reads:

| Server `HttpsError` code | Client `err.code` | UI message |
|--------------------------|-------------------|------------|
| `failed-precondition` | `pool-has-activity` | Server message (e.g. "This pool has pick history. Archive it instead of deleting.") |
| `permission-denied` | `permission-denied` | "Only the pool owner can delete this pool." |
| `not-found` | `pool-not-found` | Server message |
| `unauthenticated` | `unauthenticated` | Server message |
| `invalid-argument` | `invalid-argument` | Server message |
| anything else | raw code or `unknown` | Generic fallback |

The orchestrator (`handleConfirmDelete`) closes the confirm modal on error and surfaces the message in the Pool admin controls form error slot — same UX as the Archive flow.

---

## 4. Deploy + QA

### Deploy

`deletePoolWithCleanup` is **not** in the `deploy:functions:phishnet` script. Deploy it on its own the first time and whenever the handler changes:

```bash
firebase deploy --only functions:deletePoolWithCleanup
```

Use `firebase deploy --only functions` when you'd rather redeploy the whole codebase.

### Pre-deploy checks

- `cd functions && npm test` — full suite must pass (includes 20 `poolDelete` cases).
- `npm run lint` + `npm run build` at repo root.

### QA (smoke, in staging)

1. **Owner, no activity, multi-member:** sign in as the owner of a pool with ≥ 2 members and no submitted picks for this season; click **Delete pool** → confirm → expect redirect to `/dashboard/pools`, pool disappears, `users.pools` no longer contains the id for any member.
2. **Pool with picks:** create a pick for any member, then try to delete → expect the confirm modal to close and the form error "This pool has pick history. Archive it instead of deleting." Archive still works.
3. **Non-owner:** sign in as a non-owner member and visit the pool admin surface → Delete button should be hidden (`canAdmin` gate). Directly invoking the callable with a stale token should return `permission-denied`.
4. **Grading sanity:** confirm `gradePicksOnSetlistWrite` still runs on `official_setlists` writes and that a deleted pool's members still have their `picks` docs intact (this callable does **not** touch `picks`).

### Rollback

There is no destructive migration. If the callable misbehaves:

1. Revert the commit and `firebase deploy --only functions:deletePoolWithCleanup` to restore the prior revision (or redeploy `functions`).
2. Client calls fall back to the generic `Could not delete this pool.` error; the **Delete pool** button still renders but will no-op on failure. Owners can still **Archive** from the same surface.

---

## 5. Safety notes

- Admin SDK bypasses Firestore rules; authz is enforced in the handler. Do not loosen `pools` / `users` rules on account of this function.
- The callable re-reads `pool.ownerId`, `pool.members`, and the calendar on every invocation — **never** trust client-provided member lists or eligibility signals.
- Batch size: `MAX_POOL_DELETE_BATCH_WRITES = 500` (Firestore limit). One batch reserves the pool-delete slot before committing; pools with > 499 members will split into multiple batches automatically.
- Activity walk throughput: `chunkSize = 24` (same as the client walk). Scale only if `members.length × showDates.length` grows into multi-second round trips.
- This callable does not touch `picks`, `rollup_audit`, or any other collection — only `users.pools` (array-remove) and `pools/{poolId}` (delete).

---

## 6. Files to touch when changing behavior

- Callable handler, auth gate, batch strategy: `functions/index.js`
- Activity rule, calendar parsing, walk: `functions/poolDelete.js` + `functions/poolDelete.test.js`
- Client wrapper + error normalization: `src/features/pools/api/poolDeleteCallable.js`
- Orchestration + confirm copy: `src/features/pools/model/usePoolAdminControls.js`
- Pool admin UI: `src/features/pools/ui/PoolAdminControls.jsx`
