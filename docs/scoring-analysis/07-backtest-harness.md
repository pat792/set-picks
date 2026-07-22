# Prediction backtest harness (#648)

Offline, leakage-safe historical evaluation for the predictive picker epic ([#646](https://github.com/pat792/set-picks/issues/646)). Combined model calibration is [#649](https://github.com/pat792/set-picks/issues/649).

## What it does

1. **Import** a bounded Phish.net setlist history into a local cache.
2. **Rolling-origin backtest:** for each target show, train features only on `showDate < targetDate`, then score baselines.
3. **Report** recall@K, exact-slot hit@K, Brier, zero-score proxy, concentration.

## Leakage rules (non-negotiable)

| Allowed as features | Forbidden as features for target `T` |
|---------------------|--------------------------------------|
| Setlists with `showDate < T` | `official_setlists/T` (`setlist`, `officialSetlist`, `encoreSongs`, `bustouts`, `songGaps`) |
| Gaps **reconstructed** from prior shows | Live `song-catalog.json` gaps (post-play reset) |
| Calendar dates / tour clustering for listing imports | Same-night user picks / consensus |

Target-night setlist fields are **labels only** (what actually played / slot truth).

## Commands

From repo root (requires `PHISHNET_API_KEY` in `.env` for import):

```bash
# 1) Cache ~2 years of setlists (skips dates already on disk; --force to refresh)
npm run backtest:import-setlists -- --years=2

# Or an explicit window:
npm run backtest:import-setlists -- --from=2024-01-01 --to=2025-12-31

# 2) Run baseline comparison (needs enough cached shows)
npm run backtest:recommendations

# Optional knobs:
npm run backtest:recommendations -- --min-train=40 --recent-window=25

# 3) Unit tests (no network)
npm run test:prediction-backtest
```

## Outputs

| Path | Notes |
|------|-------|
| `data/prediction-backtest/setlists/YYYY-MM-DD.json` | Cached `ShowRecord` (gitignored) |
| `data/prediction-backtest/import-manifest.json` | Last import summary |
| `data/prediction-backtest/reports/baseline-backtest-*.{json,md}` | Metrics report |

## Baselines

| Name | Score |
|------|--------|
| `global_popularity` | Lifetime play count before `T` |
| `gap_ascending` | Reconstructed shows-since-last-play (low gap first), then plays — mirrors autocomplete heuristic |
| `recent_frequency` | Plays in trailing N shows (default 25) before `T` |

These are **slot-agnostic**. #649 adds play-likelihood × slot affinity and must beat these on the same harness.

## Interpreting the report

- **recall@5 / @10** — fraction of that night’s played songs in the top-K list.
- **slotHit@K** — mean exact hit for s1o/s1c/s2o/s2c/enc in top-K.
- **Brier** — rank→pseudo-probability calibration (lower better).
- **zeroScoreRate** — nights where locking the single top-1 song into every slot would still score 0 (harsh proxy; useful for ranking baselines).
- **top3Conc** — mass of inverse-rank scores in the top 3 (herding / concentration proxy).

## Layout

```text
scripts/prediction-backtest/
  import-setlists.mjs
  run-backtest.mjs
  lib/           # features, baselines, metrics, dataset, tests
  __fixtures__/
docs/scoring-analysis/07-backtest-harness.md
```

Reuses `functions/phishnetLiveSetlistAutomation.js` + `functions/phishnetShowCalendar.js` via `createRequire` (same pattern as `scripts/print-phishnet-tour-clusters.mjs`).
