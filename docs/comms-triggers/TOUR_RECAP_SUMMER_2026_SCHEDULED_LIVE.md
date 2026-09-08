# Summer 2026 `tour_recap` — scheduled live fan-out

| Field | Value |
|--------|--------|
| **Status** | **sent** |
| **Date scheduled** | 2026-09-07 |
| **Send window (planned)** | 2026-09-08 10:00 America/New_York |
| **Actually sent** | **2026-09-08 ~16:57 UTC** (after Firebase CLI reauth; 10:00 ET attempt blocked by expired credentials) |
| **Trigger** | `tour_recap` / template `tour-recap` |
| **Tour** | `2026 Summer Tour` (final show `2026-09-06`, 21 dates) |
| **Why manual** | Auto path (`deliverTourRecapIfFinalShow`) missed — final night graded before #510 was on prod |
| **Related** | #510 · CTA loop v1.71.1 / staging 1.72.1 |

## Live result

| Metric | Value |
|--------|--------|
| Cohort | **32** |
| processed / delivered / skipped | **32 / 32 / 0** |
| byChannel | inApp **32**, email **29**, push **2** |
| byStatus | all `delivered` |
| forceResend / bypassDailyCap | true / true |
| Podium | I have the book · TheManMulcahy · ArmenianMan |

Artifacts: `/opt/cursor/artifacts/tour_recap_full_cohort_live.json`, `tour_recap_full_cohort_live.md`

## Pre-flight

- [x] Code + CTA on prod (`main` **1.71.1**, `comms:deploy`)
- [x] Admin canary live (inApp + email)
- [x] Full cohort dry-run: 32 eligible, 31 `would_deliver`, 1 deduped (admin)
- [x] Full cohort live send completed

## Procedure used

Batched `runCommsTrigger` (`dryRun: false`, `forceResend: true`, `bypassDailyCap: true`).  
**Not** force-rollup / **not** Sphere War Room.
