# Combined recommendation model (#649)

Frozen explainable play × slot model used by the offline harness and (later) `#650` artifact.

| Field | Value |
|-------|--------|
| `modelVersion` | `v0.1.0-explainable` |
| Training | Rolling-origin on cached Phish.net setlists (`showDate < target`) |
| Formula | `slotScore = playProb × smoothedSlotAffinity` · `wildcardScore = playProb` |
| Risk bands | `safe` / `slot_fit` / `long_shot` (bustout gap ≥ 30 + low playProb) |

## Features (leakage-safe)

- Recent play rates over trailing 10 / 25 / 50 shows
- Lifetime frequency with shrinkage
- Nonlinear gap vs expected return interval (gap 0 after prior night is penalized)
- Prior-night repeat penalty
- Days-since-prior-show rest bonus
- Empirical smoothed slot affinity for s1o/s1c/s2o/s2c/enc

**Never** uses target-night `songGaps` / official setlist as candidate features.

## Go / no-go

```bash
npm run backtest:import-setlists -- --years=2
npm run backtest:recommendations
```

PASS when `combined_explainable` meets or beats each baseline on **slotHit@5** or **recall@10**. Exit code `2` on FAIL.

Weights live in `scripts/prediction-backtest/lib/model.mjs` (`MODEL_WEIGHTS`). Bump `MODEL_VERSION` when weights change and re-run the harness.

## Empirical freeze note (2026-07-22)

On a 41-show 2024 cache (`minTrain=15`, 26 eval nights), `v0.1.0-explainable` **PASS**ed go/no-go:

| Model | recall@10 | slotHit@5 | zeroScoreRate |
|-------|----------:|----------:|--------------:|
| global_popularity | 0.078 | 0.008 | 1.00 |
| gap_ascending | 0.013 | 0.000 | 1.00 |
| recent_frequency | 0.070 | 0.031 | 0.96 |
| **combined_explainable** | **0.186** | **0.185** | **0.31** |

Re-run on a wider window before Wave 3; bump `MODEL_VERSION` if weights change.

## Explanations

Each ranked song carries up to two short reasons, e.g.:

- strong s1o history (12/40)
- frequent this tour window
- due vs cadence (gap 8)
- unlikely repeat after prior night
- bustout / long-shot upside (gap 42)
