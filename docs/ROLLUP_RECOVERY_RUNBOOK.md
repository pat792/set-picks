# Rollup recovery runbook (#320 / #326)

## Preferred: `revertRollupForShow` (HTTPS callable)

Admin-only Cloud Function **`revertRollupForShow`** (same auth model as `rollupScoresForShow`):

- **Requires** `rollup_audit/{showDate}` with `processedPicks >= 1` and `lastRolledUpAt` (proves a prior rollup ran).
- **Reverses** `users.{uid}` counters using the same `computePerPickRollup` math as finalize.
- **Resets** each graded pick: `isGraded: false`, clears `gradedAt`, recomputes **`score`** from the current `official_setlists/{showDate}` using the **persistable/sanitized** setlist shape (parity with save + live scoring).
- **Merges** `rollup_audit`: `lastRevertAt`, `revertCallerUid`, `revertPickCount`, `revertNoop` (when no graded picks).

**Invoke from the app:** Admin → Official setlist → **Revert rollup (undo finalize)…** (confirmation required).

**Large shows:** Writes may span multiple Firestore batches (500-op cap). Avoid running mid-tour under extreme contention without coordination.

## When to use `resetPrematureGrade.js` instead

Use this script only when **manual** finalize ran **before the show was actually over**, picks were stamped `isGraded: true`, and **post-encore auto-finalize has not yet run** a correct first-grade rollup.

**Do not run** after `live_setlist_automation/{showDate}.autoFinalizedAt` is set and a healthy auto re-rollup has applied — use a normal admin/callable rollup path instead.

## Spotting the mistake

1. Open `rollup_audit/{showDate}` in Firestore.
2. Check `trigger: "manual"` with `processedPicks` small vs expectations, `forceEarlyFinalizeOverride: true` if the admin overrode timing, and a timestamp that is still **during** the show window.
3. Confirm picks for that `showDate` have `isGraded: true` with partial scores relative to the final setlist.

## Dry run → apply

From `functions/`:

```bash
node scripts/resetPrematureGrade.js --showDate=YYYY-MM-DD
node scripts/resetPrematureGrade.js --showDate=YYYY-MM-DD --apply
```

- **Default** prints `rollup_audit`, each graded pick, and per-user deltas that `--reconcile-users` would reverse.
- **`--apply`** writes each graded pick to  
  `{ isGraded: false, score: 0, winCredited: false, gradedAt: delete }`.

## User counters (`--reconcile-users`)

Requires **`--apply`**. Replays the same `computePerPickRollup` math used at finalize (with a pre-grade pick shape) and issues **negative** increments on `users.{uid}` for `totalPoints`, `showsPlayed`, `wins`, and `seasonStats.{tourKey}.*` when the calendar resolves a tour key.

Only use when you are confident the prior rollup was the **only** source of those increments for this show (no manual edits in between).

## After recovery

1. Let live automation finish the show, or manually save the final official setlist and run **Finalize & Rollup** once the date is **PAST** (or use the documented early override with eyes open).
2. Re-check `rollup_audit` and a sample of `users` / `picks` in the console.

## Server timing gate (reference)

`rollupScoresForShow` rejects manual finalize unless:

- `getShowStatus(showDate, show_calendar)` is `PAST`, or  
- `live_setlist_automation/{showDate}.autoFinalizedAt` is set, or  
- the callable receives `force: true` (logged on `rollup_audit` as `forceEarlyFinalizeOverride`).
