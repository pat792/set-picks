# Phase B review — picks rollup (#687)

**Review date:** 2026-07-20  
**Primary window:** Summer Tour 2026 graded nights `2026-07-07` → `2026-07-19` (10 nights)  
**Source report:** `reports/picks-rollup-2026-07-07_2026-07-19_*.md` (regenerate after tooling fixes)

## Verdict

Phase A tooling works for **volume** and **tour-grain song frequency**. Nightly song % and “rare” counts are **directional only** at current N (≈9–16 pickers/night). Consensus-vs-setlist was **broken** in the first CLI run (wrong setlist path); fixed to read `official_setlists/{date}.setlist`.

Do **not** ship product charts or new comms triggers from weak metrics yet. Prefer the green-light series below.

## Sample (graded nights only)

| Metric | Value |
|--------|-------|
| Nights | 10 |
| Submitted cards (sum) | 125 |
| Pickers / night | min **9** · avg **12.5** · max **16** |
| Slot fill | ~100% when a card is submitted |
| Pool-affiliated | ~57–90% (most nights ~75%+) |
| Unique songs (window) | 206 |
| Top songs | Golgi Apparatus + Sample in a Jar (20 cards each, 15.7%) |

Exclude in-progress nights (e.g. `2026-07-21` with 2 ungraded cards) from trend averages.

## Metric trust board

| Metric | Trust | Notes | Product / ops use |
|--------|-------|-------|-------------------|
| Submitted pickers / night | **High** | Clean count; empty docs rare | Stats page series #1 |
| Graded vs submitted | **High** | Parity on locked nights | Ops health / finalize lag |
| Pool-affiliated % | **Medium** | Stable but pool-heavy cohort; not general population | Segment, not headline KPI |
| Tour-window top songs | **Medium–High** | Useful at tour grain; titles only | Tour-stats “crowd favorites” |
| Nightly top / consensus (≥25%) | **Medium** | With N≈12, 25% ≈ 3 people; 07-17 Sample in a Jar at **53%** is real signal | Show after lock / recap |
| Slot fill rates | **Low value** | Always ~100% once submitted | Skip in UI |
| Rare (exactly 1 card) | **Low** | Most unique titles are “rare” at this N | Skip until N≫30 or define “rare among ≥2 slots” |
| Diversity proxy | **Low** | Correlated with unique songs / N | Skip |
| Consensus vs official slot | **High once fixed** | Join fixed; **8% hit rate (4/50)** this window — crowd favorites rarely match exact slots | Post-show “surprise” narrative, not a hit celebration |

## Tooling issues found in review

1. **`--tour="Summer Tour"` matched all years** (2024/2025/2026) → 78 nights, avg 1.6 diluted by zeros.  
   **Fix:** default `--tour` to the latest year present unless `--from`/`--to` set.
2. **Setlist join used the wrong path** (doc root vs `doc.setlist`).  
   **Fix:** load `official_setlists/{date}.setlist`.
3. **Zero-night noise** in markdown when calendar includes past empty summer labels. Prefer `--from`/`--to` or omit zero nights from the highlights section (follow-up).

## Insights worth keeping (this window)

- Volume is **flat-ish mid-teens**, dip to 9 on 07-10, peak 16 on 07-15 — enough for a trend chart, not for nightly song leaderboards as primary UX.
- Crowd magnets: **Golgi Apparatus**, **Sample in a Jar**, **Buried Alive**, **Bug**, **Set Your Soul Free**, **The Moma Dance**.
- Strongest single-night consensus: **2026-07-17** Sample in a Jar on **53%** of cards (with Golgi 40%, Bug 27%).
- Crowd slot favorites vs official setlist: only **8%** exact-slot hits (4/50) — useful as “band vs crowd” surprise framing, not as a skill scoreboard.
- Cohort is **pool-heavy** — product insights will overweight pool members until solo pickers grow.

## Phase C recommendations (draft)

### Stats page / data viz (product)

1. **Ship first:** “Pickers per show night” line/bar for the active tour (exclude future/zero nights).
2. **Ship second (tour grain):** Top 10 crowd picks this tour (% of cards) — reuse profile aggregation ideas, not per-user.
3. **Ship later:** Per-night consensus strip **after lock** (or after grade), with copy that N is small.
4. **Defer:** Rare picks, diversity index, slot fill %.

### Data / pipeline

1. Optional materialized `picks_night_stats/{showDate}` written at lock or finalize (submitted count, top songs) to avoid full `picks` scans on the client.
2. Keep report CLI as the internal source of truth until that exists.

### Comms (after product metrics land)

1. Use submitted volume only as a **guardrail** for reminder urgency (e.g. low pickers tonight) — join with existing `no_picks_tonight` eligibility; do not invent a new trigger from this review alone.
2. Post-show: optional “crowd favorite vs what played” once consensus-vs-setlist is validated on a few nights — fits near `show_recap` (#572), not a new channel.
3. Do **not** message rare picks or diversity scores.

## Exit criteria for Phase B

- [x] Focused Summer 2026 graded window reviewed
- [x] Metrics classified High / Medium / Low
- [x] Tooling defects logged and fixed for setlist path + tour year default
- [ ] Human sign-off on Phase C priority order (this doc)
- [ ] Open follow-up issue(s) for stats-page series when ready to build

## How to re-run

```bash
cd functions
node scripts/picksRollupReport.js --tour="Summer Tour" --out=../docs/picks-rollup/reports
# or explicit:
node scripts/picksRollupReport.js --from=2026-07-07 --to=2026-07-19 --out=../docs/picks-rollup/reports
```
