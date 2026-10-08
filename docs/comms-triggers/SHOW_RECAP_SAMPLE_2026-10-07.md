# Sample night paragraph — Richmond, 2026-10-07

**Status:** writer check. Nothing was sent.
**Date:** 2026-10-08
**Show:** Allianz Amphitheater at Riverfront, Richmond, VA. 2026 Fall Tour.
**Map:** [SHOW_RECAP_FACT_INVENTORY.md](./SHOW_RECAP_FACT_INVENTORY.md)

The live lines below are what went out before this change. The writer lines are what the night map produces from the same facts. The morning job does not read this page. After the change is deployed, it fills those sentences from the stored facts and sends.

The standings paragraph (“you climbed,” “next up”) is the same in both. The night map does not rewrite it.

## What the show facts were

Saved set-flow line, which the live email speaks whole:

> Set 1 opened with Gumbo (8 songs); Set 2 added 6; encore closed on The Lizards.

Songs actually in the sets:

- Set 1 (8): Gumbo, The Curtain With, Hey Stranger, Llama, Roggae, Tube, Timber (Jerry the Mule), Most Events Aren't Planned
- Set 2 (6): Kill Devil Falls, Ruby Waves, Golden Age, Meatstick, Backwards Down the Number Line, Loving Cup
- Encore: The Lizards, Julius

The night context’s bustout sticker is “The Curtain,” with no gap stored on that sticker. The set list does not contain “The Curtain.” It contains “The Curtain With,” gap 11, last played 2026-07-27. A separate gap row named “the curtain” is 197 shows and has no last-played date. Those two did not join, so the map did not treat The Curtain as a song inside set 1. [#1083](https://github.com/pat792/set-picks/issues/1083) requires the paragraph to drop a bustout title that is not in the official setlist. This night is the fixture.

Highest gaps that did sit inside a set:

- Set 1: Hey Stranger, 23 shows, last played 2026-07-10
- Set 2: Meatstick, 18 shows, last played 2026-07-17

## Cold board

Live email, night paragraph:

> I have the book, here's how last night at 2026-10-07 — Allianz Amphitheater at Riverfront, Richmond, VA went. Set 1 opened with Gumbo (8 songs); Set 2 added 6; encore closed on The Lizards. Tough board — none of your six landed; still a night to remember: Bustout: The Curtain. That lands you #10 of 13 globally.

Writer paragraph from the same facts:

> An 8-song first set, highlighted by Hey Stranger, a 23 show gap, last played on 2026-07-10. A 6-song second set, highlighted by Meatstick, an 18 show gap, last played on 2026-07-17. A 2-song encore featured The Lizards and Julius. None of your six landed. That lands you #10 of 13 globally.

What changed: each set is one sentence, with its length and its rarest song. Both encore songs are named, with the encore length. “Tough board / still a night to remember” dropped because “none of your six landed” is a real player fact. The bustout sticker did not move into set 1, because its title is not a song in that set.

Standings paragraph, unchanged:

> After last night's show you slipped 1 spot. Still in the top 5 — ranked #3 of 17 with 55 points. Next up: 2026-10-09 — VyStar Veterans Memorial Arena, Jacksonville, FL.

## Mixed board

Live email, night paragraph:

> Rivertranced, here's how last night at 2026-10-07 — Allianz Amphitheater at Riverfront, Richmond, VA went. Set 1 opened with Gumbo (8 songs); Set 2 added 6; encore closed on The Lizards. You hit set 2 opener, closer, and wildcard (3 of 6); Bustout: The Curtain stayed off your board. That puts you #1 of 13 globally.

Their card: Kill Devil Falls was the set 2 opener (exact). Loving Cup was the wildcard (exact). Ruby Waves was picked as the closer and was in the show in a different slot (5 points, not an exact slot).

Writer paragraph from the same facts:

> An 8-song first set, highlighted by Hey Stranger, a 23 show gap, last played on 2026-07-10. A 6-song second set, highlighted by Meatstick, an 18 show gap, last played on 2026-07-17. A 2-song encore featured The Lizards and Julius. You hit the set 2 opener and the wildcard. That puts you #1 of 13 globally.

The map’s player rule keeps the first true fact. Exact slots are ahead of a wrong-slot song, so Ruby Waves is not spoken. The live line calls that closer a hit.

Standings paragraph, unchanged:

> After last night's show you climbed 3 spots. Still in the top 5 — ranked #5 of 17 with 50 points. Next up: 2026-10-09 — VyStar Veterans Memorial Arena, Jacksonville, FL.
