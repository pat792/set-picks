# Summer 2026 tour_recap — execute plan

| Field | Value |
|-------|--------|
| **Status** | draft — waiting on `comms:deploy` after `v1.71.0` on `main` |
| **Date** | 2026-09-07 |
| **Trigger** | `tour_recap` (#510) |
| **Code on main** | `v1.71.0` (promote #1018; staging tip still `1.72.0` for same feature) |
| **Related** | Almost-end (`marketing_summer_2026_almost_end`) already shipped 2026-08-03 — do **not** re-send |

## Why manual / replay is needed

Happy path is **post-final-show grade**: `rollupScoresForShow` → `deliverPostRollupComms` → `deliverTourRecapIfFinalShow` → `deliverCommsTrigger("tour_recap")`, gated by `COMMS_EVENT_ADAPTERS_ENABLED=true`.

Dick’s closed **2026-09-04–06**. Final night (`2026-09-06`) almost certainly graded **before** `tour_recap` landed on `main`, so the auto fan-out window was missed. Deploy alone does not backfill.

## Deploy checklist (prod)

1. On `main` @ `v1.71.0`: `npm run comms:deploy:validate`
2. `npm run comms:deploy -- --confirm` (or at least `--group hookHosts` + `--group infra` so `rollupScoresForShow` + `runCommsTrigger` update)
3. Confirm env on live revisions:
   ```bash
   gcloud functions describe rollupScoresForShow --gen2 --region=us-central1 --project=<project> \
     --format='value(updateTime,serviceConfig.environmentVariables.COMMS_EVENT_ADAPTERS_ENABLED)'
   ```
   Must be `"true"`. If unset, set and redeploy the gated hook hosts / adapters.

## Manual / replay options (after deploy)

### A — Preferred: force re-rollup final show (uses production fan-out)

1. Confirm final tour date in `show_calendar/snapshot` (`2026 Summer Tour` last date = Dick’s N3).
2. War Room / admin: call `rollupScoresForShow` with `{ showDate: "2026-09-06", force: true }` (admin claim).
3. With adapters enabled, `deliverTourRecapIfFinalShow` builds podium + rank-branch payloads and delivers.
4. Dedup key `tour_recap:{tourId}:{uid}` prevents double-send if a partial run already landed.

### B — Canary then fan-out via `runCommsTrigger`

1. Build recipient payloads the same way as `deliverTourRecapIfFinalShow` (standings from tour picks + `buildTourRecapPayload`).
2. Admin callable `runCommsTrigger`:
   ```json
   {
     "triggerId": "tour_recap",
     "recipients": [{ "uid": "<canary>", "payload": { /* rank, points, podium, … */ }, "vars": { "uid": "…", "tourId": "2026 Summer Tour" } }],
     "dryRun": true
   }
   ```
3. Review `would_deliver` / channel breakdown → re-call with `dryRun: false` for canary uid(s).
4. Full cohort: same callable in chunks (adapter runtime caps ~150 recipients/invocation) with `dryRun: false`. Use `forceResend: true` only if intentionally overriding dedup.

### C — Do **not** use Sphere War Room panel

`deliverSphere2026TourRecapInbox` is Sphere ’26 archive / QA only. Wrong template and audience for Summer 2026.

## Editorial strategy (Summer wrap)

| Layer | Recommendation |
|-------|----------------|
| **Runtime** | Ship with generic `tour-recap` + send-time podium/rank (already on `main`). |
| **Edition flavor** | Optional follow-up: `content/comms/tours/summer-2026-final.md` for tour-tape narrative (bustouts, MSG theme, Dick’s close). Out of scope for #510; separate drafter pass. |
| **Almost-end** | Keep as historical mid-tour send; inbox doc `marketing_summer_2026_almost_end` stays. |
| **Channels** | in-app (full) + push tease + abbreviated email; honor `notificationPrefs.results`. |
| **Measurement** | Log `comms_delivered` with `trigger_id: tour_recap`; compare open/CTA vs almost-end in next Optimize pack. |

## Suggested execute order

1. Deploy + verify `COMMS_EVENT_ADAPTERS_ENABLED=true` on `rollupScoresForShow`.
2. Dry-run **one** admin uid via `runCommsTrigger` (option B) — confirm copy/rank branch.
3. Execute full tour via **option A** (force rollup of `2026-09-06`) unless rollup is unsafe; then fall back to batched B.
4. Spot-check inbox + Resend; note deliver counts in #510 / Optimize thread.
5. (Optional) Drafter: Summer final edition markdown for next tour or a polish resend (only with `forceResend` + PM approval).
