# Issue #164 — Hands-off live setlist updates and auto-scoring

**GitHub:** [pat792/set-picks#164](https://github.com/pat792/set-picks/issues/164)

**Implementation branch:** `feat/issue-164-live-setlist-automation` (commit `a6e05d3` at time of documentation).

This document records what was delivered for this issue and how each **acceptance criterion** from the ticket is satisfied by that work.

---

## Work completed

### Live ingestion (scheduled)

- **`scheduledPhishnetLiveSetlistPoll`** in `functions/index.js` polls Phish.net every **2 minutes** (`America/New_York`) for **ET today** and **ET yesterday** (`candidateShowDates` in `functions/phishnetLiveSetlistAutomation.js`).
- Uses **`PHISHNET_API_KEY`** from Secret Manager only (same pattern as other Phish.net functions).

### Idempotent setlist merge / write

- Inbound payload is normalized and compared to the last persisted state via **`sourceMeta.signature`** (SHA-256 of stable row representation) and **`setlistPayloadEqual`** fallback.
- **No Firestore write** when the meaningful setlist payload is unchanged; automation doc still records `lastResult: no-change` where applicable.
- **`sourceMeta`** on `official_setlists/{showDate}` documents `source`, `signature`, `songCount`, `lastFetchedAt`, `pollMode` (see `docs/OFFICIAL_SETLISTS_SCHEMA.md`).
- **Partial setlists:** slot fields derived from sets with only one song do not overwrite `s1c` / `s2c` with the opener; prior non-empty slots are preserved when the new payload has not yet filled them (`buildSetlistDocFromRows`).

### Automatic live score refresh

- Meaningful updates use **`setDoc`** with `merge: true` on `official_setlists/{showDate}`, which triggers existing **`gradePicksOnSetlistWrite`** (`onDocumentWritten`) and recomputes **`picks.score`** only (same as before; **`isGraded`** / rollup unchanged).

### Safety rails

- **Pause / resume per show date:** Firestore `live_setlist_automation/{showDate}` plus callable **`setLiveSetlistAutomationState`** (admin email gate). Scheduled poll skips dates with `enabled: false`.
- **Rate limit / backoff:** repeated failures increment `failureCount` and set **`nextPollAt`** with exponential backoff (capped); scheduled runs respect `nextPollAt`.
- **Non-admins:** automation callables use the same **`assertAdminEmail`** pattern as other admin functions.

### Observability + ops

- Structured **`logger.info`** for each scheduled cycle (`live setlist poll cycle`) and manual runs (`manual live setlist poll`) with dates, per-date results, and duration.
- **Manual recovery:** callable **`pollLiveSetlistNow`** (admin-only) forces one poll and, if the setlist changed, one explicit **`recomputeLiveScoresForShow`** for incident recovery.
- **Runbook:** `docs/PHISHNET_CALLABLE_RUNBOOK.md` §10 (live-night SOP and rollback).

### Tests

- **`functions/phishnetLiveSetlistAutomation.test.js`:** idempotent diff helpers, partial-feed slot preservation, and a **historical progression replay** simulation (incremental Phish.net-style payloads).
- **`npm run test`** in `functions/` and **`npm run test`** (vitest) at repo root were run successfully for this delivery.

### Admin UI

- **`AdminLiveSetlistAutomationControls`** under admin “Live automation”: pause/resume and **Force poll + score refresh** wired via `liveSetlistAutomationApi.js` and `useAdminSetlistForm`.

### Deploy

- **`npm run deploy:functions:phishnet`** (root and `functions/`) includes:
  `scheduledPhishnetLiveSetlistPoll`, `setLiveSetlistAutomationState`, `pollLiveSetlistNow`.

---

## Acceptance criteria (fulfilled by this job)

| # | Criterion | Fulfilled | How |
|---|-----------|-----------|-----|
| 1 | During a live show, new songs on Phish.net appear in `official_setlists/{showDate}` automatically | **Yes** | Scheduled poller fetches v5 setlist by date, merges into `official_setlists` when signature/payload differs. |
| 2 | `picks.score` refreshes automatically without admin clicking save | **Yes** | Setlist doc write triggers `gradePicksOnSetlistWrite`; live path still updates **`score`** only. |
| 3 | Finalize / rollup behavior unchanged | **Yes** | No changes to finalize/rollup callables or admin finalize flow; grading semantics remain on the existing rollup path. |
| 4 | No duplicate writes when payload unchanged | **Yes** | Early exit when signature matches and/or `setlistPayloadEqual`; no `setDoc` for identical meaningful payload. |
| 5 | Admin can pause automation and manually resume / recover | **Yes** | `setLiveSetlistAutomationState` + admin UI; `pollLiveSetlistNow` for forced poll + recompute. |

---

## Post-merge / environment checklist (outside this repo job)

These items validate behavior in **staging or production** after deploy; they are not a gap in the implementation itself.

- [ ] Deploy functions with updated `deploy:functions:phishnet` list.
- [ ] Confirm `PHISHNET_API_KEY` is bound on new function revisions.
- [ ] Live or staging smoke: watch logs for `live setlist poll cycle` on an active show date.
- [ ] Confirm pause stops scheduled writes and resume restores them.
