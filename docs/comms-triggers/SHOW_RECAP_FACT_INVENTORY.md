# Night recap fact inventory

**Status:** draft
**Date:** 2026-10-08
**Issues:** [#1083](https://github.com/pat792/set-picks/issues/1083) · parent [#1081](https://github.com/pat792/set-picks/issues/1081)
**Code:** `functions/commsShowContextCore.js` `composeSetFlowSummary` · `functions/showRecapNarrativeCore.js`

Message map for one paragraph. The shelf of facts for every communication is [COMMS_FACT_INVENTORY.md](./COMMS_FACT_INVENTORY.md). This file says which of those facts the night paragraph may speak.

The morning daily recap and the night note share that paragraph. A sentence may speak a fact only when it is true for that night or that player. Missing facts drop out. No model writes the paragraph.

## What the set-flow line does today

`set_flow_summary` is saved on `comms_show_context/{showDate}` and the paragraph speaks it when it is present. The line is one template with a different kind of fact in each clause:

| Set | What the sentence includes | What it leaves out |
|-----|----------------------------|--------------------|
| Set 1 | Opener title, and the song count in parentheses | Every other set 1 song. No gap, no bustout. |
| Set 2 | Song count only (`Set 2 added 9`) | Opener, any song title, any gap |
| Encore | The first encore title only (`encore closed on Harry Hood`) | Later encore songs. The count is used only when the first title is missing. |

A full line reads: “Set 1 opened with Bathtub Gin (8 songs); Set 2 added 9; encore closed on Harry Hood.”

“Song opened; Song closed the night” is the fallback when that saved line is blank. It is not the line people are reading on a normal night.

## Stock lines that do not change

These wrappers repeat every night in that branch. The only moving part is the sticker or the list of slots that hit.

| Branch | Fixed words |
|--------|-------------|
| Cold, and they missed the bustout | “Tough board — …; still a night to remember:” |
| Cold, no highlight | “Tough board tonight — standings still have the full picture.” |
| Hot | “Strong night —” |
| Bustout caught | “You caught a bustout —” |
| Mixed / hot, bustout missed | “… stayed off your board.” |

## Facts we already keep

This is the shelf. A row means we can look the fact up at send time. It does not mean the paragraph already says it.

**Written today** is the sentence people get now. **Next sentence** is the slot in the sections below that will use the fact. “Leave unused” means the fact stays on the shelf and the paragraph does not say it.

| Fact | Where | Written today | Next sentence |
|------|-------|---------------|---------------|
| Set 1 / set 2 / encore song lists | `official_setlists`, grouped by set | Set 1 opener, and the first encore title | Encore slot names every encore song. Highlight slot uses the list to place a song in its set. |
| Song counts per set | `comms_show_context.set_counts` | Set 1 count in parentheses. Set 2 count alone. Encore count only when the first title is missing. | Length slot: “An 8-song first set,” and the same shape for set 2 and the encore. |
| Set 2 opener | Setlist field `s2o` | Used only to know where set 2 starts | Leave unused, unless that set has no bustout, no high gap, and no tour debut. Then it is the fallback title. |
| Gap for every song (show count) | `official_setlists.songGaps` | Only gaps of 30 or more, and only as the bustout sticker | Highlight slot reads this map for the song in that set, including high gaps (10–29). |
| Bustout title + gap | `bustout_titles`, `bustout_entries` on the night context, copied from `official_setlists.bustouts` | One sticker, not placed in its set. The sticker can name a song that is no longer in the set. | Same highlight slot when the song is a bustout **and** that title is in the official setlist. Player slot when they caught or missed that played song. One of those, not both. |
| Last played before that night | `public_tour_stats` bustout and high-gap rows, `lastPlayed`. Rebuilt at 7:30am Eastern, before the 8:00am Pacific recap. | Not written | Highlight slot adds “last played on {date}” when that row has a date. |
| Song-picker last played | Song catalog `last_played` | Not written | Leave unused. After the show this date can already be last night. The tour-table date above is the play before that night. |
| Tour debut titles | `tour_debut_titles` | Not written in this paragraph. An older one-line highlight uses them only when the night had no bustout. | Highlight slot for a set with no bustout and no high gap. Player slot when they caught or missed one. |
| Venue and city | `venue_name`, `venue_city` on the send | The email greeting names the venue | Flow sentence names the room when the other highlight slots are empty. |
| Exact slot vs song only in the show | `calculateSlotScore` | Written as “you hit {slot}” for both | Player slot separates them. Exact slot stays “you hit {slot}.” In the show, wrong slot: “{Song} was in the show, just not your encore.” |
| Score, night rank, pool rank | The send | Written | Stays. The extra scorecard after the paragraph drops once this is already said. |
| Branch (`cold`, `mixed`, `hot_night`, `bustout_hero`) | `narrative_branch` | Picks the stock wrapper. The branch name is not shown. | Still picks the order of player slots. The stock words remain only when no player slot is true. |

## Flow slots to speak instead

Same shape for each set. Speak a slot only when that fact is true. Put the rare song in the set where it was played.

1. **Length.** “An 8-song first set.”
2. **Highlight in that set.** The bustout in that set, otherwise the highest pre-show gap in that set. “highlighted by {song}, a {gap} show gap, last played on {date}.” The date is `lastPlayed` on that bustout or high-gap row. The title has to be a song in that set. A shorter or older title is not the same song.
3. **Tour debut in that set,** when there is no bustout and no high gap.
4. **Encore titles.** Every encore song, not only the first. “The encore featured {Song A} and {Song B}.”

Set 1 opener stays the fallback when that set has no bustout, no high gap, and no tour debut.

When the bustout or high-gap row has no `lastPlayed`, the sentence keeps the song and the gap and drops the date.

## Player slots that replace the stock wrapper

Pick the first one that is true. The stock “tough board / strong night / still a night to remember” line remains only when none of these exist.

| Slot | Example shape |
|------|----------------|
| All six hit | “You hit all six.” |
| None hit | “None of your six landed.” |
| Named slots that hit | “You hit the opener and the encore.” |
| Wrong slot | “{Song} was in the show, just not your encore.” |
| Bustout they caught | “You caught {song} — a {gap} show gap — on your wildcard.” |
| Bustout they missed | “{Song} ({gap} show gap) stayed off your board.” |
| Tour debut they caught or missed | “{Song} was new to the tour, and it was your set 2 opener.” |

One bustout sticker stays. It does not also appear as the set highlight and the player line in the same paragraph. Prefer the player line when they picked it. Otherwise the set that contained it.

## Slot ids

[#1082](https://github.com/pat792/set-picks/issues/1082) stores these ids when the sentence actually spoke the slot. It does not invent its own names. At most one player id. A flow id is stored only when that set’s fact was spoken. The stock wrapper is not an id.

| Id | Slot |
|----|------|
| `set1_length`, `set2_length`, `encore_length` | Length |
| `set1_highlight`, `set2_highlight` | Highlight in that set, including last played when the date exists |
| `encore_titles` | Every encore title |
| `venue_fallback` | The room, when that set has no highlight |
| `all_six`, `none_hit`, `named_slots`, `wrong_slot`, `bustout_caught`, `bustout_missed`, `tour_debut` | Player line, first one that is true |
| `night_rank` | The rank line this paragraph already speaks |

The branch id stays `cold`, `mixed`, `hot_night`, or `bustout_hero`.

## Boundary

Complete for the next paragraph: one length line per set, one highlight in that set, every encore title, and one player line. Every fact those sentences need is on the shelf above.

Not a catalog of every fact in the app. Held off this paragraph on purpose:

- Who led the room and the top score. Already on the in-app card.
- Bustout bonus points. The score line already has the night total.
- Tour rank change (“climbed / slipped”). That stays in the other paragraph of the morning email.
- The song-picker last-played date. It can already be last night.

A bustout counts only when its title is in that night’s official setlist. `official_setlists.bustouts` does not drop a title after Phish.net renames the row, so the sticker can outlive the played song. Richmond, 2026-10-07: the bustout list is “The Curtain” (197 shows) and the set contains “The Curtain With” (11 shows). The paragraph must not say The Curtain. This is an acceptance fixture on [#1083](https://github.com/pat792/set-picks/issues/1083). The live-poll union that keeps bustouts from shrinking mid-show stays as it is. The filter belongs on the paragraph, once the setlist is final.

Still open inside this paragraph:

- Two rare songs in one set. The highlight slot does not say which one wins. Use the bustout with the longest gap, then the high gap with the longest gap.
- First show of a tour. `tour_debut_titles` lists up to eight songs because nothing has been played yet. Do not call those tour debuts.
- A last-played date for a gap under 10. The count is on `songGaps`. The date is stored only on bustout and high-gap rows (gap 10 or more). Drop the date.

## Out of scope

- A model writing what the night felt like
- The tour-standing paragraph in the same morning email (“you climbed,” “next up”)
- The end-of-tour wrap ([#1084](https://github.com/pat792/set-picks/issues/1084))
