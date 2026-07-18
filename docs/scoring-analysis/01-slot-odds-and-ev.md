# Slot odds and expected value

Snapshot ~2026-07-18. Join of graded `picks` × `official_setlists`, scored with production `scoringCore`.

## Headline

Under the live rule **encore exact = any song in `encoreSongs[]`**, encore has the **highest** exact-hit rate among positional slots—not the lowest. Aggregate EV is only slightly above the mean (~3–5%); the larger issue is **mis-distribution** (first and later encore songs pay the same 15).

## User hit rates (n ≈ 203–204 filled picks / slot)

| Slot | Exact % | In-setlist % | Miss % | Avg base pts (EV) |
|------|---------|--------------|--------|-------------------|
| S2 Closer | 2.94% | 21% | 76% | 1.35 |
| S2 Opener | 3.43% | 23% | 74% | 1.49 |
| S1 Opener | 3.94% | 19% | 77% | 1.35 |
| S1 Closer | 5.39% | 24% | 71% | **1.71** |
| Encore (any) | **6.37%** | 11% | 82% | 1.52 |
| Wildcard | — | hit 14.3% | 85.7% | ~1.43 base / ~1.92 w/ bustout |

Absolute exact counts (any-encore rule): encore **13**, s1c **11**, s1o **8**, s2o **7**, s2c **6**.

## Points fairness vs S1 opener @ 10

Implied fair exact pts ≈ `10 × (s1oExactRate / slotExactRate)`.

| Slot | Exact rate | Awarded | Implied fair exact pts vs S1O@10 | Difficulty vs S1O |
|------|------------|---------|----------------------------------|-------------------|
| S2 Closer | 2.94% | 10 | 13.4 | 1.34× harder |
| S2 Opener | 3.43% | 10 | 11.5 | 1.15× harder |
| S1 Opener | 3.94% | 10 | 10.0 | baseline |
| S1 Closer | 5.39% | 10 | 7.3 | easier |
| Encore (any) | 6.37% | 15 | ~6.2 | easiest exact |

Exact-tier EV contribution: S1 opener ~0.39 vs encore ~0.96 (~2.5×).

## Flat encore X to match mean EV (~1.47)

`EV(X) = 0.0637×X + 0.1127×5`

| Flat encore X | Encore EV |
|---------------|-----------|
| 10 | 1.20 |
| 12 | 1.33 |
| **14** | **~1.46 ≈ mean** |
| 15 (current) | 1.52 |

## Framework note (stats layer)

Today picks persist `score` and aggregate `correctSlotsCredited`, not per-slot kinds. For durable odds/stats: persist `slotResults` at grade time; roll up show/tour/global slot rates. See epic #646 measurement workstream and issue #645.

## Scoring rules at snapshot

```text
EXACT_SLOT = 10
ENCORE_EXACT = 15   # any encoreSongs[] match
IN_SETLIST = 5
WILDCARD_HIT = 10
BUSTOUT_BOOST = 20  # gap ≥ 30 on frozen bustouts snapshot
```
