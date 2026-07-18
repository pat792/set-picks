# Significance and setlist variability

## Are observed encore odds statistically significant?

**No.** Across five positional slots (exact rates), omnibus χ² ≈ 3.94, df = 4, **p ≈ 0.41**. Largest pairwise gap (encore 6.37% vs S2 closer 2.94%): z ≈ 1.65, **p ≈ 0.10** (Fisher ≈ 0.16).

- ~204 picks / slot come from only **17 shows** (~12 picks/show) → clustering; effective n roughly **64–132**, not 204.
- Power: detecting those gaps at 80% would need ~**600–1300** independent picks / slot (before design effect).

**Do not rebalance scoring solely from this user-hit ranking.** Prefer supply-side setlist variability and larger samples.

## Supply-side variability (Phish.net, Phish-only)

### Last 24 months (~105 shows)

| Slot | Shows | Unique songs | Entropy (bits) | Effective # songs | Match prob (HHI %) | Mode top-1 % |
|------|-------|--------------|----------------|-------------------|--------------------|--------------|
| S1 Opener | 105 | 51 | 5.32 | 39.9 | 3.20 | 7.6 |
| S1 Closer | 105 | 48 | 5.16 | 35.7 | 3.66 | 8.6 |
| S2 Opener | 100 | 54 | 5.49 | 44.9 | 2.66 | 6.0 |
| S2 Closer | 100 | 39 | 4.96 | 31.2 | 3.94 | 9.0 |
| Encore (1st) | 102 | 64 | 5.72 | **52.9** | **2.40** | 6.9 |

**First encore is the most variable single song** (highest entropy / effective N). Closers are the most concentrated.

### Encore “two chances”

- Multi-encore shows: **~85%**; avg encore length **~2.16** songs (last 24 mo).
- Best first-encore mode guess ≈ **6.9%** hit.
- Best any-encore mode guess (e.g. Tweezer Reprise) ≈ **15.7%** hit (~2.3× on supply side).

### Same user guesses, two scoring rules (n = 204)

| Rule | Exact-hit rate | Absolute hits |
|------|----------------|---------------|
| First encore only | **1.96%** | 4 |
| Avg positional exact | 3.93% | — |
| Any encore (today) | **6.37%** | 13 |

Realized **3.25×** multiplier from any-of-2 vs first-only (larger than raw song count because popular guesses often land in the **second** encore).

**Tug-of-war:** bigger encore pool (~40% more effective songs) is real → first-encore is hardest. The any-of-2 rule more than offsets it → net easiest exact under current scoring.

Paired bootstrap HHI: encore distinguishes from closers (p ≈ 0.02); not from openers at 105 shows.
