# Social visual production

**Status:** active  
**Date:** 2026-09-25  
**Owners:** Brand Systems Partner (layouts) · Social Media Specialist (angles) · Social Demand Gen (packs)  
**Related:** #974 · `docs/design.md` · `content/marketing/974-owned-social-cadence-brief.md`

Social skills read this file **before any Canva call**. A brand-kit id is not a template.

---

## Color and type

Match these, on every post. Tokens are `docs/design.md`; the drawn versions are the designs below.

- **Ground:** deep indigo / slate (`#020617`, `#0f172a`, Kuroda indigo). Glass card when the beat is a number, a score, or one sentence.
- **Type:** teal display kicker or teal numeral (`#2dd4bf`). Light body under it. One teal rule. Space Grotesk, not a new face.
- **Mark:** vinyl disc, or the horizontal wordmark (red `#ef4444` → blue `#3b82f6`), sitting at the bottom. Do not redraw it.
- **Score numeral:** amber on the score layout only. Stat counts stay teal. Do not spray amber onto other layouts.

Stage light is allowed. A dark empty stage, teal practicals, and a spotlight wash can be the ground when they stay in this indigo/teal family. Story chrome, doodles, torn paper, fake handles, placeholder addresses, and new fonts are not.

---

## Layouts to copy

Feed size is **1080×1350**. Copy the design, then change only the words in the last column. Hashtags and the UTM’d URL stay in the demand-gen caption. The short path already on the card can stay.

| Layout | Design | Edit | Use when | Change only |
|--------|--------|------|----------|-------------|
| Slot card | `DAHWEIn-uPI` | [slot-card](https://www.canva.com/d/3xpIkE_CqQCBQ6D) | Six slots, lock, how the game works | Teal kicker and the six-line list |
| Gradient question | `DAHGet9xUvU` page 1 | [question](https://www.canva.com/d/plCbWpuUsgLgIPb) | One fan question, no list | The question. Outlined white type on the blue gradient stays |
| Stat | `DAHWIyXpOJU` | [stat](https://www.canva.com/d/z9Pw2ux7bCw-b7c) | One tour aggregate | The number and the label under the rule |
| Score | `DAHWI4tNpHY` | [score](https://www.canva.com/d/eaYtpQzUi44e9hO) | One real score event | The amber figure and the line under the rule |
| Line | `DAHWI4Tc5Lg` | [line](https://www.canva.com/d/2dya7aF0Mekts7l) | One sentence: crew, origin, lock | The sentence inside the glass band |

`DAHWEERqOdE` is the same slot-card system on two pages. Copy `DAHWEIn-uPI` instead. Lockup page of `DAHGet9xUvU` (page 2) is the wordmark closer, not a feed post by itself.

If none of the five fits, stop and ask. Do not invent a sixth layout. `generate-design` is still banned: it does not apply this type, even with brand kit `kAHJGQBYBxc`.

---

## Stage light, and what is still rejected

The 2026-09-25 Fall Tour opener’s empty stage and teal side lights are a usable **ground**. They are not a layout. Put slot-card / question / stat / score / line type on a ground like that. Do not ship those files as posts.

| File | Id | Why it stays off the copy list |
|------|----|--------------------------------|
| Fall Tour opener | `DAHWOm2Yr8g` | Right kind of stage. Wrong type: white caption bar, not the teal kicker |
| Six guesses | `DAHWOni-U_s` | Stage wash is fine. Story-card chrome is not |
| Your crew | `DAHWOl74HsE` | Corner blocks and a second type system |
| Card is open | `DAHWOjCSPcI` | Doodle stars, mixed scripts |
| Boardwalk Hall tonight | `DAHWOvKLlcE` | Misspelled sign was in the photo |
| Torn-paper six picks | `DAHWENXt0fg` | Off-palette ground and slot typos |

---

## Required sequence

1. Read this file.
2. Pick a row. Name it in the draft.
3. `copy-design` of that id. Never edit the source.
4. On the **copy**: `replace_text` for the words in the table. A stage-light ground may replace the flat field only when the type, rule, glass, and mark from the source stay put.
5. Show the preview. `commit-editing-transaction` only after the user says save.
6. Caption, four hashtags, and `utm_campaign=seo_geo` go in `social_demand_gen draft`. Publishing stays L2.

Voice still follows `content/marketing/974-owned-social-cadence-brief.md`: no song list, no predicted set, no night recap pasted into a tour post. A stat or score number has to be a real figure already on the site, not an invented one.
