# Summer 2026 `tour_recap` — scheduled live fan-out

| Field | Value |
|--------|--------|
| **Status** | scheduled |
| **Date scheduled** | 2026-09-07 |
| **Send window** | **2026-09-08 10:00 America/New_York** (EDT; 14:00 UTC) |
| **Trigger** | `tour_recap` / template `tour-recap` |
| **Tour** | `2026 Summer Tour` (final show `2026-09-06`, 21 dates) |
| **Why manual** | Auto path (`deliverTourRecapIfFinalShow`) missed — final night graded before #510 was on prod |
| **Related** | #510 · CTA loop v1.71.1 / staging 1.72.1 |

## Pre-flight (already done)

- [x] Code + CTA on prod (`main` **1.71.1**, `comms:deploy`)
- [x] Admin canary live (inApp + email)
- [x] Full cohort **dry-run** 2026-09-07: **32** eligible, **31** `would_deliver`, **1** `deduped` (admin / ArmenianMan)
- Artifacts: `tour_recap_full_cohort_dryrun.md` / `.json`

## Do **not** use

- War Room / `deliverSphere2026TourRecapInbox` (Sphere archive only)
- Blind `rollupScoresForShow({ showDate: "2026-09-06", force: true })` as the primary path — that also re-fires night `show_recap` / engagement for the whole field

## Live procedure (agent or human)

1. Re-confirm adapters: `COMMS_EVENT_ADAPTERS_ENABLED=true` on `runCommsTrigger` / rollup (already set).
2. Rebuild cohort the same way as the dry-run (standings from graded picks across tour dates).
3. Call `runCommsTrigger` in batches (~40):
   - `triggerId: "tour_recap"`
   - `dryRun: false`
   - `forceResend: true` (clears admin dedup; safe for first full send)
   - `bypassDailyCap: true` (batch QA/send sitting; avoid rankings-cap collisions)
   - `recipients: [{ uid, payload, vars }]` with real `buildTourRecapPayload` (podium + ranks)
4. Persist result JSON under `/opt/cursor/artifacts/tour_recap_full_cohort_live.json`.
5. Spot-check: admin email **View Recap** → Messages; inbox CTA **View tour standings**.
6. Update this doc status → `sent` with counts (`delivered` / `skipped` / `byChannel`).

## Expected shape (from dry-run)

| Metric | Dry-run |
|--------|---------|
| Cohort | 32 |
| would_deliver | 31 (+ admin needs `forceResend`) |
| Podium | I have the book · TheManMulcahy · ArmenianMan |
| Channels | mostly inApp+email; some +push; few inApp-only |

## Cancel / slip

- Cancel the Cursor Agent timer `tour-recap-summer-2026-live` if the send should not run.
- Or reply in-thread before 10:00 ET to abort / reschedule.
