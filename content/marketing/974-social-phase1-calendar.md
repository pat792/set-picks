# #974 — Phase 1 social calendar (no autonomy)

**Status:** draft  
**Date:** 2026-09-23  
**Issue:** [#1046](https://github.com/pat792/set-picks/issues/1046) · parent #974 · epic #972  
**Loop:** [`974-social-post-loop.md`](./974-social-post-loop.md)  
**Shows:** `scripts/seed/show_calendar_tour_overrides.json` — Fall Tour 2026-10-02 through 2026-10-11

Phase 1 means you paste. The loop builds the pack. It does not post. Off-weeks are 1–2 posts. Show weeks are 2, inside the cadence cap of 2–4. Card-open only runs when a card is actually open. Bustout Boost only runs when a locked pick earns it. A stat only runs when that number is already on `/tour-stats`.

Instagram and Threads, same words, `utm_source` swapped. X is deferred. Facebook is not a post.

| Paste date | Week | Slot | Layout | Path | State |
|------------|------|------|--------|------|--------|
| 2026-09-25 | Off (Sep 21–27) | How it works | `slot-card` | `/how-it-works` | Pack ready. [`974-first-pack-how-it-works.md`](./974-first-pack-how-it-works.md). You paste. |
| 2026-09-29 | Show (Sep 28–Oct 4). Card not assumed open yet. | Scoring | `line` until `score` exists; this beat is the explain, not a Boost hit | `/how-scoring-works` | Loop not run. |
| 2026-10-02 | Show. First Fall show. | Card is open | `slot-card` | `/phish-setlist-prediction-game` | Only if the card is open. If it opened earlier, paste that day instead and skip this row. |
| 2026-10-06 | Show (Oct 5–11) | Card is open | `slot-card` | `/phish-setlist-prediction-game` | Only if a new card is open for this run. |
| 2026-10-11 | Show. Last Fall night in the seed. | Tour-stats aggregate | `stat` | `/tour-stats` | Only if the figure is already on the page. Build `stat` in Canva before this date. |
| 2026-10-14 | Off (Oct 12–18) | About. One origin post this month. | `line` | `/about` | Build `line` before this date. |

Skip a row rather than invent a song list, a Boost, or a card-open. If Sep 29 is already a card-open day, that row becomes card-open and the scoring explain moves to the next off-week.

## Before those dates

| By | Build |
|----|--------|
| 2026-09-25 | Paste the how-it-works pack. No new template. |
| 2026-10-11 | `stat` master in Canva, from the template menu. |
| 2026-10-14 | `line` master. |
| When a Boost hits | `score` master. Do not schedule the hit. |
