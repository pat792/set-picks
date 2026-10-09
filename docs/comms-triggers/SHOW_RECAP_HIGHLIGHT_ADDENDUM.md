# Night paragraph highlight addendum

**Status:** implemented (#1105). The night paragraph uses these lines.
**Date:** 2026-10-08
**Amends:** [SHOW_RECAP_FACT_INVENTORY.md](./SHOW_RECAP_FACT_INVENTORY.md) highlight slot
**Sample it rewrites:** [SHOW_RECAP_SAMPLE_2026-10-07.md](./SHOW_RECAP_SAMPLE_2026-10-07.md)

“Highlighted by” says the song was the center of the set. A long gap does not tell us that. A jam or a long song might have been the center, and we do not have duration or jam notes. This addendum changes the words on the gap. It still names one song per set. It does not claim that song was the musical highlight.

The length sentence stays (“An 8-song first set”). The encore stays the list of every encore title. A bustout (30 or more shows, and the title in that set) stays the line that ships today. A trusted tour debut, when the set has no gap of 10 or more, stays “new to this tour.”

## Which line a set gets

Look at the pre-show gaps for songs in that set. A missing gap means that song cannot help decide the set.

1. A bustout in the set. Keep today’s line: “highlighted by {song}, a {gap} show gap, last played on {date}.”
2. The longest gap in the set is 20–29. Rarity line below.
3. The longest gap in the set is 11–19. Return line below.
4. Every song in the set has a gap, and every gap is 10 or fewer. Rotation line below.
5. Otherwise, today’s next fact: a trusted tour debut, then the set 1 opener, then the venue.

A gap of 10 sits in “10 or fewer,” so the whole set uses the rotation line. “Saw the return” starts at 11. One song at 23 means the rarity line, even if other songs that night were under 10.

Last played stays on the rarity line and the return line when that date exists. A missing date drops the date and keeps the song and the gap.

## 20–29 shows

An 8-song first set featured a relative rarity of late: Hey Stranger, a 23 show gap, last played on 2026-07-10.

## 11–19 shows

A 6-song second set saw the return of Meatstick after an 18 show gap, last played on 2026-07-17.

## Every gap is 10 or fewer

An 8-song first set featured heavy rotation songs, with crowd favorite You Enjoy Myself.

Crowd favorite is the song in that set with the highest lifetime play count. That count is already on the shelf: song catalog `total`, copied onto the tour table as `lifetimePlays`. It is the band’s history, not how many players picked the song.

The night paragraph does not load that count today. This line cannot ship until the writer can see it for the songs in the set. If two songs share the highest count, name the one earlier in the set. If no song in the set has a count, say “featured heavy rotation songs” and drop the name. If any gap in the set is missing, do not use this line.

## Richmond, 2026-10-07, rewritten

Nothing here was sent. Set 1’s longest in-set gap is Hey Stranger at 23. Set 2’s is Meatstick at 18. The Curtain stays out, because that title is not in the set.

> An 8-song first set featured a relative rarity of late: Hey Stranger, a 23 show gap, last played on 2026-07-10. A 6-song second set saw the return of Meatstick after an 18 show gap, last played on 2026-07-17. A 2-song encore featured The Lizards and Julius.

The player line and the rank line stay as they are in the Richmond sample.
