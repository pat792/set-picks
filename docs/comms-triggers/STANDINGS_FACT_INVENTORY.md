# Standings paragraph fact inventory

**Status:** implemented
**Date:** 2026-10-08
**Issue:** [#1102](https://github.com/pat792/set-picks/issues/1102) · parent [#1081](https://github.com/pat792/set-picks/issues/1081)
**Code:** `functions/tourRankingsDailyCore.js` `buildTourRankingsDailyParagraphs` · `src/features/notifications/model/tourRankingsDailyCopy.js`

Message map for the standings half of the morning `tour_rankings_daily` email. The shelf of facts is [COMMS_FACT_INVENTORY.md](./COMMS_FACT_INVENTORY.md). The night paragraph and the end-of-tour wrap have their own maps.

Yesterday’s rank is the rank before this show. Today’s rank is the tour rank this morning. The spot sentence already says climbed, slipped, or held. This map is the second sentence: whether that move crossed the lead or the top 5.

Bands:

- **Lead** — rank 1
- **Top 5** — ranks 2 through 5
- **Field** — rank 6 or worse

Yesterday’s rank is recovered from today’s rank and the spot count. Climbed 3 from 5th means yesterday was 8th. Held means yesterday and today are the same rank. A missing spot count means yesterday’s rank is unknown, and the sentence does not claim a crossing.

Debut night and a late joiner keep the copy they already have. They do not use this table.

## Permutations

| Yesterday | Today | Sentence |
|-----------|--------|----------|
| Lead | Lead | “You’re leading the tour.” |
| Top 5 | Lead | “You took the lead.” |
| Field | Lead | “You took the lead.” |
| Lead | Top 5 | “Out of the lead, still in the top 5 — ranked #N.” |
| Top 5 | Top 5 | “Still in the top 5 — ranked #N.” A climb or a slip that stays inside 2–5 uses this line. |
| Field | Top 5 | “You climbed into the top 5 — ranked #N.” |
| Lead | Field | “You fell out of the top 5 — ranked #N.” |
| Top 5 | Field | “You fell out of the top 5 — ranked #N.” |
| Field | Field | Today’s rank sentence. No top-5 claim. |
| Unknown | Lead | “You’re leading the tour.” |
| Unknown | Top 5 | “In the top 5 — ranked #N.” Not “still,” and not “climbed into.” |
| Unknown | Field | Today’s rank sentence. |

Points and a tie, when they exist, stay on that sentence the way they do today.

## What stays

The first sentence is still the spot count: climbed N, slipped N, or held. “Next up” is unchanged. The night paragraph is unchanged.

## Out of scope

- How often the lead changed hands across the whole tour. That is the wrap map.
- A second fact label on this send. The morning email already labels the night paragraph.
