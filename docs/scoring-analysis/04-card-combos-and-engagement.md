# Card combos, zeros, and predictive coupling

## Nightly score distribution (204 graded picks)

| Score | Share |
|-------|-------|
| 0 | **27.5%** |
| 1–5 | 28.9% |
| 6–10 | 13.2% |
| 11–20 | 17.6% |
| 21–35 | 9.3% |
| 36+ | 3.4% |

- Mean **10.0**, median **5**, P90 **25**, max **55**.
- Gini ≈ **0.565**; top/median ≈ **11×**.

## Engagement floor vs encore leniency

| Mechanic | Rescues from zero | Share |
|----------|-------------------|-------|
| Encore (any-of-2) | 8 | 3.9% |
| Wildcard | 5 | 2.5% |

Zeros mostly miss **all** songs in the show. Encore leniency barely moves the floor; **predictive nudges** and consolation design matter more for zeros.

## Breadth (“N slots scoring”) incidence

“Correct” = any points on a slot (matches `correctSlotsCredited` semantics).

| Slots scoring | Share |
|---------------|-------|
| 0 | 27.5% |
| 1 | 36.3% |
| 2 | 19.6% |
| 3 | 9.8% |
| 4 | 5.4% |
| 5 | 1.0% |
| 6 | 0.5% |

Exact counts (wild excluded): 0 exact 80.4%; 1 exact 17.2%; 2 exact 2.5%; 3+ exact **0**.

Set sweeps (both S1 or both S2 any points): either ≈ 11.8%. Both positions exact in a set: **0**.

## Recommended breadth ladder (highest tier only)

Never cumulative.

| Slots scoring | Bonus | Notes |
|---------------|-------|-------|
| 0–1 | 0 | |
| 2 | Badge only (or tiny +2) | Becomes routine if predictions lift hit rates |
| 3 | +5 | First leaderboard combo |
| 4 | +10 | |
| 5 | +15 | |
| 6 | +20 | Perfect-card jackpot |

Historical sim (if +2 at 2 and above ladder): ~36% get some bonus; mean +~1.7 pts; zeros unchanged.

Round-5-only (no points at 2): ~17% get bonus; mean +~1.3 pts.

## Precision companion

| Exact slots | Bonus |
|-------------|-------|
| 2 | +5 |
| 3 | +10 |
| 4 | +15 |
| 5 | +25 |

Cap **card + precision ≤ +25**. Bustout stacks separately with a rarity ceiling.

## Coupling with predictive picker (#646)

If per-slot any-points rate rises from ~22% → ~28–35%, share of cards with 2+ hits rises ~40% → ~54–68%, and breadth EV rises. Recalibrate **after** Prediction Lab evidence.

Principles when coupled:

- Scoring identical for manual vs recommended picks.
- Engine predicts song/slot likelihood—not leaderboard points.
- Offer Safe / Slot-fit / Long-shot to reduce herding.
- Prefer points starting at **3** breadth hits if recommendations work.

## Avoid stacking

Do not ship breadth + set-sweep + precision + uncapped bustout multipliers without shared caps. Prefer badges for overlapping thematic milestones.
