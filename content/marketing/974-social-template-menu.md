# #974 — Social template menu (Brand Systems)

**Status:** draft (Brand Systems proposal — not built in Canva, not EiC-approved)  
**Date:** 2026-09-23  
**Issue:** #974 · epic #972 · crew epic #695  
**Spec:** `docs/design.md`  
**Parents:** [`974-social-creative-path.md`](./974-social-creative-path.md) · [`974-owned-social-cadence-brief.md`](./974-owned-social-cadence-brief.md)

A single how-it-works frame is the wrong lock. The cadence already has several beats. This menu is the set of layouts those beats may use. Demand Gen picks one layout per post. It does not invent a new one.

---

## Evaluation of the proof frame

The saved Canva design (`DAHWEERqOdE`) proved the logo can be placed. It is not a template.

`docs/design.md` puts the product on a deep venue ground (`brand-bg` `#0f172a`, `brand-bg-deep` `#020617`) with neon teal (`brand-primary` `#2dd4bf`) for scores and the one action. The red-to-blue gradient (`#ef4444` → `#3b82f6`) belongs to the **wordmark**, not the whole canvas. The proof frame filled the post with that gradient, so it reads as a logo slide, not the app.

The primary lockup in the spec is `public/branding/splash-gradient-4x1.svg`. The circular vinyl (`public/branding/splash-vinyl-mark.webp`) is the profile mark already on Instagram. Both may appear. Neither is redrawn in Canva.

Type: **Space Grotesk** for the headline, **Inter** for slot names and the footer line. Shapes: `rounded-xl` panels, not pills, for the six slots. One teal emphasis per frame.

---

## Shared system (every layout)

| Token | Use on the post |
|-------|-----------------|
| Ground | `#020617` to `#0f172a`. No full-bleed logo gradient. |
| Panel | Translucent slate card, hairline border, `rounded-xl`. |
| Headline | Space Grotesk on the site. This Canva account does not list it. Canva headline face is **HK Grotesk Pro**. White. |
| Slot / stat / body | Inter. |
| Emphasis | Teal `#2dd4bf` on the one fact that matters (a score, “card is open”, the boosted slot). |
| Lockup | Gradient wordmark **or** vinyl, bottom, never both at full size. |
| Forbidden | Song lists, predicted setlists, full-night recaps, a second layout invented in the chat. |

Canvas for the feed: **1080×1350** (the Instagram preset already used). A square crop is a later resize of the same layout, not a second design system.

---

## Menu

Pick one row per post. The caption and URL still come from the cadence brief.

| Id | Layout | Use when | What changes | What stays |
|----|--------|----------|--------------|------------|
| `slot-card` | Six empty slots in a glass card | How it works, card is open | Headline only: “Six picks. Live scoring.” or “Card is open.” | Slot names, in order: Set 1 opener, Set 1 closer, Set 2 opener, Set 2 closer, Encore, Wildcard |
| `score` | One number, large | Bustout Boost™ actually hits | The `+20` and a one-line reason (30+ show gap) | No setlist |
| `stat` | One aggregate | Tour-stats beat | The figure and its label (most played, unique songs, bustouts this tour) | The number must already be on `/tour-stats` |
| `line` | One sentence | About, max once a month | The `/about` line only | No origin essay on the image |
| `lockup` | Wordmark or vinyl, almost alone | Highlight cover, later | Which mark | No caption block |

`slot-card` is built and saved in Canva as design `DAHWEIn-uPI` (1080×1350, title `slot-card`). Edit: https://www.canva.com/d/AjUUZ3G6gDLt2Eb — deep ground, teal headline, six slot names, vinyl mark. Slots are Inter. Space Grotesk is not in this Canva font list. Headline face on the master is **HK Grotesk Pro**. The edit API cannot change font family, so that selection stays in the Canva editor. Layout was widened after that change so the headline and each slot stay on one line. The image shows `setlistpickem.com/how-it-works`. The caption still carries the full `utm_campaign=seo_geo` URL. That path swaps when the beat changes. It does not yet have the glass card from the spec. `score` and `stat` are next. `line` and `lockup` wait.

---

## How a post uses the menu

1. Social Media Specialist names the cadence slot.
2. Brand Systems names the layout id from this table. If none fits, add a row here before anyone opens Canva.
3. Demand Gen writes the caption and the one swappable line (headline, `+20`, or the stat).
4. The agent fills that Canva template and exports. EiC approves the pair.

Do not freestyle with `generate-design` again. The proof frame stays a reference that the connection works, not the master.
