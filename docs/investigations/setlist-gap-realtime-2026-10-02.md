# Investigation: live setlist gaps of 0

**Status:** draft investigation — options only; no code ship yet  
**Date:** 2026-10-03 (observation window 2026-10-02, Atlantic City N1, set 1 in progress)  
**Surfaces:** Standings setlist Gap column, bustout badge, tour-stats Bustouts / High gaps  
**Related:** #587 Phase B (freeze `songGaps`), #1062 / v1.75.2 (later poll replaces the frozen gap), #214 (bustouts from the same row `gap`)

## Verdict

The standings Gap column is printing the Phish.net **setlist-row** `gap` from the latest live poll. On the in-progress 2026-10-02 setlist that value is **0 for 5 of 6 songs**. That 0 is not the settled pre-show gap, and it is not uniformly “one show low.”

The number that used to look right on the setlist was the **first poll’s row gap, kept for the rest of the night**. That first number was usually the settled Phish.net gap minus 1, because tonight was not in the show index yet. Tour stats read the same frozen map, so they sat one below the completed Phish.net setlist page. v1.75.2 (#1062) stopped keeping the first number and started storing whatever the latest poll says. During a live show the latest poll mostly says 0, so the column collapsed.

The songs-catalog `gap` is a different field. It also reads 0 tonight, and it will stay 0 after the show. It does not resolve to the pre-show gap. Real-time bustouts cannot use it.

Settled setlist-row gaps do match a count we can compute ourselves: Phish shows from the previous Phish performance of that song through tonight, including tonight. That count is available while the row `gap` is still 0. The live poller should use it for the Gap column and for the bustout threshold, and keep the raw row `gap` only as a later confirmation.

## What the standings column actually reads

Standings does not compute a gap. `StandingsOfficialSetlistCard` looks up `official_setlists/{showDate}.songGaps` and prints the integer, including 0 (`getOfficialSetlistGap`).

That map is written by the live poller:

1. `deriveSongGapsFromRows` copies each row’s Phish.net `gap`. First occurrence of a title wins, so a same-show reprise does not replace the opener.
2. `mergeSongGaps` combines that map with the map already stored on the show.

Tour stats do not have a second formula. `aggregateTourSetlistStats` ranks Bustouts and High gaps from the same `songGaps` values (and from `bustouts`, which is derived from the same row `gap` with a floor of 30).

Bustout Boost scoring reads `official_setlists.bustouts`, not `songGaps`. Membership is still decided by row `gap >= 30`. A live 0 never qualifies, so the badge and the boost wait until some poll returns a gap of at least 30.

## How the setlist gap used to be kept

From #587 (2026-07-16, v1.29.0) through the change in v1.75.2, `mergeSongGaps` walked the new poll first and then the stored map, and the stored value overwrote the new one. The comment said the pre-show gap is fixed for a given show, so an earlier poll stays stable.

Practical effect:

- The first time a song appeared, its row `gap` was stored.
- A later poll could add a song that was not in the feed yet (set 2 arriving after set 1).
- A later poll could not change a gap already stored, including replacing a real number with 0.
- `mergeBustouts` was, and still is, a union. A bustout captured once was never removed by a later partial feed.

That first stored number is what the setlist column showed all summer. It tracked the live setlist closely enough to look right. It was usually **one below** the gap Phish.net publishes on the completed setlist.

### Why that number was one low

On a finished show, the setlist-row `gap` equals the distance in the Phish show index:

`settled gap = index(this show) − index(previous Phish performance of this song)`

Gap 1 means “played the previous Phish show.” Gap 0 on a finished show is a same-show reprise. Checked against Phish-only shows from 2024 through 2026, this matched the recorded gap on the settled rows sampled (Fuego, Ghost, Wave of Hope, Slave, Pillow Jets, It’s Ice, Harry Hood), with one older exception (Fuego on 2026-04-23 is stored as 0 against an index distance of 7).

Before tonight is inserted in that index, the same subtraction lands on the previous show, so the row is short by 1. #1062 recorded that as: the first live poll is often one show low; a later poll, once tonight is in the index, carries the settled number. The code comment says not to add 1 in our own code, because the later poll is supposed to bring the corrected value.

Tour stats pages surface those frozen integers next to a mental check against the Phish.net setlist page. They were one low because they were still holding the first poll. The setlist column was holding the same integer; it only looked more accurate because that was the number present while the show was being listened to.

## What v1.75.2 changed

Shipped 2026-09-28 (#1062). `mergeSongGaps` now prefers the **current** poll. A stored gap is kept only when that song is absent from this poll, so a set-1-only feed does not wipe set 2.

`setlistPayloadEqual` also compares `songGaps`, so a gap-only correction is written even when the song list is unchanged. `npm run backfill:song-gaps -- --existing` re-fetches settled row gaps and rewrites historical maps. It does not touch `bustouts`.

That fix is right for a later poll whose gap is the settled number (2051 stored, 2052 on the next poll). It is wrong when the later poll’s gap is a live 0. The 0 replaces the earlier reading, and the column follows it.

## What Phish.net is returning during this show

Fetched 2026-10-03 00:53 UTC (about 8:53pm ET), `GET /v5/setlists/showdate/2026-10-02`. Set 1 only, six songs. “Expected” is the settled index-distance formula above. “One low” is that number minus 1, which is what the old first-poll freeze usually stored.

| Song | Live row `gap` | Expected settled gap | One-low (old freeze) | Previous Phish play |
|---|---:|---:|---:|---|
| Fuego | 0 | 1 | 0 | 2026-09-06 |
| A Wave of Hope | 0 | 2 | 1 | 2026-09-05 |
| Slave to the Traffic Light | 0 | 9 | 8 | 2026-07-24 |
| Pillow Jets | 0 | 17 | 16 | 2026-07-12 |
| It’s Ice | 0 | 7 | 6 | 2026-07-27 |
| Ghost | 1 | 1 | 0 | 2026-09-06 |

Same moment, `GET /v5/songs/slug/{slug}` for each of those titles: `gap = 0` and `last_played = 2026-10-02` on all six, including Ghost, whose setlist row is already 1.

A finished show from the same API does not look like this. Dick’s 2026-09-06 (16 songs) had no zeros. 2026-07-22 had one zero, on the second David Bowie of the night (a reprise). The 2026-07-31 Melt the Guns row is the #1062 example: settled gap 2052, which is the index distance back to 1987-04-29, not 0.

### Is the live 0 an anomaly?

No. It is the in-progress behavior, and it is not one rule.

- Ghost already has the settled gap (1). The API can be right mid-show.
- Fuego’s 0 happens to equal the old one-low value, because the settled gap is 1. A reader cannot tell “placeholder” from “played last show” by looking at 0 alone.
- Wave of Hope, Slave, Pillow Jets, and It’s Ice are 0 where both the settled gap and the one-low gap are greater than 0. Those are uncomputed placeholders, not a systematic off-by-one.

The songs-catalog `gap` is not a placeholder that gets repaired after the show. Docs define it as shows since the song was last played. As soon as tonight is `last_played`, the catalog gap is 0 and stays 0 until a later show. The pre-show gap lives on the historical setlist row, which is filled in later.

Phish.net’s own docs do not define setlist-row `gap`, and they do not say that live rows are 0 until the show is final. They do say responses are cached for about five minutes. The zeros above are in the cached body, not a client parse error (`parseRowGap` keeps 0; it only drops negatives and non-numeric values).

## Why this blocks real-time bustouts

`deriveBustoutsFromRows` ignores a row unless `gap >= 30`. A placeholder 0 never becomes a bustout on that poll.

`mergeBustouts` will add the song later if a subsequent poll arrives with a real gap. Two limits on that rescue:

- The scheduled poller only runs in the show’s local 4pm–4am window. A correction that lands the next morning is not polled. Recovery is the manual `backfill:song-gaps` script, and that script rewrites `songGaps` only. It does not rebuild `bustouts`.
- Auto-finalize’s score reconcile runs when the **song-list signature** changes. The signature ignores `gap`. A later poll that only fills gaps updates the setlist doc (and `gradePicksOnSetlistWrite` refreshes `pick.score`) but does not re-run the rollup that adjusts `users.totalPoints`.

So “wait for Phish.net to resolve the row after the show” misses the live badge, and it can also miss the graded bustout boost if the fill-in happens after finalize without a song-list edit.

## Options

### A. Compute the settled gap while the row is untrusted (recommended)

During the live window, for each new title, take the previous **Phish** performance from `setlists/slug/{slug}` (`showdate` strictly before tonight) and the Phish show index (`shows/showyear`, `exclude_from_stats` off). Display and bustout-eligibility use:

`index(tonight) − index(previous play)`

That is the number settled rows already use. On tonight’s six songs it yields 1, 2, 9, 17, 7, 1. Ghost matches the API. The four hard zeros become the real gaps. Pillow Jets (17) would show as a high gap immediately. A 30+ bustout would clear the threshold on the poll that first sees the title, without waiting for the row `gap` to leave 0.

Keep writing the raw row `gap` beside it. When a later poll’s row `gap` equals the computed value, freeze the row value and stop recomputing that title. Historical backfill stays “copy the settled row,” which is what #1062 got right for finished shows.

Do this in the live poller (`deriveSongGapsFromRows` / `deriveBustoutsFromRows`), not in the React card. Tour stats, crowd pulse, and scoring all read the frozen doc.

Cost: one cached show-index fetch per year, plus one slug history call per new song per show (a night is on the order of 15–25 songs). Cache both for the night. Phish.net asks clients to cache and refresh at least daily; this stays inside that. `official_setlists` in our database is not a substitute: it only has game nights, so a 1987 bustout cannot be counted from it.

### B. Do not let a live 0 replace a better stored gap (companion to A)

Restore the useful half of the pre-#1062 merge, without going back to “first poll wins forever”:

- If this poll’s gap is **greater** than the stored gap, store it. That still absorbs the #1062 +1 (2051 → 2052) and a later fill-in from 0 to the real number.
- If this poll’s gap is 0 and the stored gap is greater than 0, keep the stored gap, unless the title already occurred earlier in **this** show (reprise). Reprises are the legitimate settled 0.
- If the song is absent from this poll, keep the stored gap (already true).

B alone does not fix a show whose first sighting is already 0. Tonight is that show. A is what produces the first real number. B is what stops a later placeholder from wiping it, which is the regression #1062 introduced.

### C. Do not read the songs catalog for this

`songs.gap` / `last_played` flipped to `0` / `2026-10-02` for every song already in the setlist, including Ghost. Using the catalog as a fallback while the setlist row is 0 would report every in-progress song as a gap of 0, which is the bug. The weekly `song-catalog.json` has the same fields and the same reset, on a slower clock. It remains the right source for autocomplete and for “what is the gap right now,” not for “what was the gap at the start of this show.”

### D. Add 1 in code

Rejected. #1062 already ruled this out for settled rows, and tonight confirms it. Ghost’s live row is already the settled 1; adding 1 makes it 2. Fuego’s 0 plus 1 happens to be right. Slave’s 0 plus 1 is 1, and the settled gap is 9. A blanket increment repairs only the songs whose true gap is 1.

### E. Hide 0 until the row fills in

Honest display: blank instead of 0 unless the title is a same-show reprise or the computed gap really is 0. No false bustouts. Also no real-time bustouts, which is the constraint that prompted this note. Use only as the failure path when the index lookup in A fails.

### F. One correction poll after the window

If A is unavailable for a night, the 4am cutoff still strands both `songGaps` and `bustouts` on whatever the last in-window poll stored. A single next-morning poll (or the existing `--existing` backfill extended to recompute `bustouts` and reconcile graded scores) repairs tour stats and the archive. It does not put the badge up during the show. Worth doing as a backstop even if A and B ship, because settled rows are still the source of truth once Phish.net fills them, and gap-only updates do not reconcile `totalPoints` today.

## Recommendation

Decouple the live Gap column and the live bustout decision from the raw setlist-row `gap`. Compute option A, protect it with option B, and keep option F so a morning fill-in still repairs anything the index lookup missed. Leave settled-show backfill as a straight copy of the row `gap`. Do not consult `songs.gap`.

The live API is not generally reporting the correct gap while songs are being added. It sometimes is (Ghost, this set). It often reports 0 for a song whose settled gap is nowhere near 0. Treating that 0 as data, which v1.75.2 now does, is what the standings column is showing.
