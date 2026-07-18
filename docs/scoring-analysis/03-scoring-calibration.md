# Scoring calibration (encore & bustouts)

## Calibration method

Points ∝ `1 / P(exact)`, anchored so geometric mean of four positional slots ≈ 10, then snapped to round multiples of 5 (floor at 10 so exact beats in-setlist 5).

Supply odds = best single-song (“mode”) guess from last-24-mo setlists.

## Positional slots

Odds cluster in a **6–9%** band → at round-5 granularity, exacts stay **flat 10**. Provisional future premium: S2 opener (hardest supply-side).

## Encore tiers (Model X — recommended)

| Event | User hit rate | Calibrated | Round pts |
|-------|---------------|------------|-----------|
| 1st encore exact | 1.96% | ~20 | **15** |
| Later encore song | 4.41% | ~9 | **10** |
| In-setlist only | 11.3% | ~3.5 | **5** |

- Model Y (later = 5) underpays a ~1-in-23 event.
- Model X encore-slot EV ≈ **1.30** (vs positional avg ~1.47).
- Current any = 15 → EV **1.52** (slight overpay vs mean; large overpay vs S1 opener on exact difficulty).

## Wildcard

~14% hit rate → calibrates toward **5** if fairness-primary; keep **10** only as intentional safe-points.

## Bustout variability (economy-aware)

Perfect clean night ≈ **65** under Model X base (4×10 + 15 + 10). Today’s flat **+20** is already **2× a slot** (~31% of a night).

Gap distribution (Phish, last 24 mo, ~1868 played rows):

| Gap band | Share of songs | Avg fires / show |
|----------|----------------|------------------|
| 30–74 | 6.7% | 1.95 |
| 75–149 | 2.5% | 0.76 |
| 150–299 | 1.0% | 0.31 |
| 300+ | 0.7% | 0.13 |

### Flat models

| Tier | Gap | Current flat | Scaled flat (recommended) |
|------|-----|--------------|---------------------------|
| Bustout | 30–74 | +20 | **+15** |
| Rarity | 75–149 | +20 | **+20** |
| Deep cut | 150–299 | +20 | **+30** |
| Vault | 300+ | +20 | **+40** |

### Multiplier model (1.5× / 2× / 3× / 4× of base)

Bonus on a 5 / 10 / 15 base compounds. Cap bonus at **+40** or prefer scaled flat—otherwise a 15-pt first-encore vault can total **75** (> clean night).

Only ~5 bustout boosts fired across 204 historical picks—rare moments if the song must also be correctly picked.

## Implementation notes

- Client/server parity: `src/shared/utils/scoring.js`, `functions/scoringCore.js`.
- Model X needs primary `setlist.enc` vs other `encoreSongs[]`.
- Bustout tiers need gap bands (`songGaps` or tiered snapshot)—see `docs/OFFICIAL_SETLISTS_SCHEMA.md`.
- SemVer: scoring rule change = **MINOR**; regrade vs grandfather TBD.
