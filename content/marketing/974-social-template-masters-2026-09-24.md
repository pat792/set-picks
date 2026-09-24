# #974 — Social template masters (`score`, `stat`, `line`)

**Status:** draft (Brand Systems — not EiC-approved, not posted)  
**Date:** 2026-09-24  
**Issue:** [#974](https://github.com/pat792/set-picks/issues/974) · follow-on [#1046](https://github.com/pat792/set-picks/issues/1046) · epic [#972](https://github.com/pat792/set-picks/issues/972) · crew [#695](https://github.com/pat792/set-picks/issues/695)  
**Sibling:** [PR #1047](https://github.com/pat792/set-picks/pull/1047) (`feat/1046-social-phase1-loop`) owns the loop, calendar, and template menu. This pack fills the next menu rows that PR left unbuilt.  
**Does not:** authorize a live post, publish or share Canva designs, write the Brand Kit (API cannot), create a Brand Template (API cannot), or close #974 / #1046.

---

## Why this pack

`content/marketing/974-owned-social-cadence-brief.md` (on `staging`) and #1046 already name the beats. The #1046 template menu (`974-social-template-menu.md` on PR #1047) already has `slot-card` as Canva master `DAHWEIn-uPI`. That menu’s next line is:

> `score` and `stat` are next. `line` and `lockup` wait.

#1046’s Phase 1 calendar still needs those frames before paste:

| Paste date | Slot | Layout | Build gate |
|------------|------|--------|------------|
| 2026-09-29 | Scoring explain | `line` until a scoring frame exists | `score` now exists — use it for this education beat. Do **not** claim a live Bustout Boost™ unless one actually hit. |
| 2026-10-11 | Tour-stats aggregate | `stat` | Build before this date. Figure must still be on `/tour-stats` the day you paste. |
| 2026-10-14 | About (one origin post this month) | `line` | Build before this date. |

This pack builds those three masters by **copying `slot-card`**, not by running `generate-design`. No new campaign. No new layout ids.

`lockup` (highlight covers) still waits. The creative-path note on PR #1047 says highlight covers wait until a Story exists.

---

## Canva inventory (do not delete)

### Brand kit

| Kit | Id | Notes |
|-----|----|-------|
| Setlist Pick 'Em | `kAHJGQBYBxc` | Use this kit. Do not invent a second kit. |
| (unnamed) | `kAGpVKCjmvY` | Ignore for this program. |

**Brand Templates:** none. `search-brand-templates` (all + scoped to `kAHJGQBYBxc`) is still empty. The Canva MCP has **no write API** for Brand Kits or Brand Templates (`list-brand-kits` and `search-brand-templates` are read-only; `create-design-from-brand-template` needs a `BTM*` id we do not have). Autofill is Enterprise-only.

#### Intended kit (repo source of truth — not written onto the kit)

`docs/design.md` §2 plus the CSS vars it points at in `src/index.css` / `tailwind.config.js`. Do not invent a second palette.

| Role | Hex | Source |
|------|-----|--------|
| Brand primary / kicker | `#2DD4BF` | design.md + `--brand-primary` `45 212 191` |
| Brand strong | `#14B8A6` | design.md + `--brand-primary-strong` `20 184 166` |
| Venue bg (docs table) | `#0F172A` | design.md `brand-bg`; same channel as `--surface-field` |
| Venue deep (docs table) | `#020617` | design.md `brand-bg-deep` — **used on these masters** |
| Venue bg (runtime CSS) | `#1E1B4B` | `--brand-bg` `30 27 75` (indigo-950 / Kuroda) |
| Venue deep (runtime CSS) | `#0F0A2E` | `--brand-bg-deep` `15 10 46` |
| Wordmark gradient start | `#EF4444` | design.md `brand-accent-red` |
| Wordmark gradient end | `#3B82F6` | design.md `brand-accent-blue` |
| Content secondary | `#CBD5E1` | `--content-secondary` `203 213 225` |
| Rank gold | `#D97706` | design.md; not used on these frames |
| White | `#FFFFFF` | primary type |

**Fonts (repo):** Space Grotesk (`public/fonts/space-grotesk/SpaceGrotesk-VariableFont_wght.woff2`) for headlines; Inter (`public/fonts/inter/InterVariable.woff2`) for body. `format_text` cannot set `font_family`. These masters still use HK Grotesk Pro + Inter as selected in the Canva editor on `slot-card`.

**Images / icons uploaded to the account library (not attachable to the kit via API):**

| Repo file | Role | Canva `mediaId` |
|-----------|------|-----------------|
| `public/branding/splash-vinyl-mark.webp` | App chrome / social mark | `MAHWI9qNlyI` |
| `public/branding/email-gradient-wordmark.png` | Gradient lockup | `MAHWIyP7KCM` |
| `public/favicon/apple-touch-icon.png` | Apple app icon | `MAHWI5ixnaw` |
| `public/favicon/web-app-manifest-512x512.png` | PWA icon | `MAHWI9rs1ys` |
| `public/branding/og-card-1200x630.png` | Marketing OG card | `MAHWI3l7xuo` |

Applied onto `score` / `stat` / `line`: vinyl `MAHWI9qNlyI` (not the wordmark — menu says one mark). Emphasis `#2DD4BF`. Supporting lines `#CBD5E1`. Ground stays `#020617`. Wordmark / app icons / OG stay in Uploads for a human to drop into kit `kAHJGQBYBxc` in the Canva Brand Kit UI.

**2026-09-24 restyle:** those three unpublished masters only. `slot-card` and older designs were not edited. Nothing published or shared.

### Existing designs left untouched

| Title | Id | Role |
|-------|----|------|
| `slot-card` | `DAHWEIn-uPI` | Feed master for how-it-works / card-is-open. Do not edit in this pack. |
| Gradient Vinyl-themed Instagram Post | `DAHWEERqOdE` | Proof frame. Not a template. |
| Instagram Post - Six picks. Live scoring. | `DAHWENXt0fg` | Earlier generate-design leftover. Do not use. |
| Setlist Pick ‘Em (Instagram Post (4:5)) | `DAHGet9xUvU` | Older 2-page post. Not the menu. |
| Wordmark / 4×1 / website copies | `DAHGebhzESY`, `DAHGeSGP6wY`, `DAHGMPt77D0`, `DAHGxLwG7uQ`, … | Brand lockups. Not feed templates. |

### Masters created 2026-09-24 (draft, unpublished)

Copied from `DAHWEIn-uPI`. Titles match the menu ids. Ground replaced with a clean `brand-bg-deep` `#020617` fill so flattened slot names from the `slot-card` background do not ghost through.

| Id | Title | Canvas | Swappable line | Footer path | Repo PNG | Edit (current session) |
|----|-------|--------|----------------|-------------|----------|------------------------|
| `score` | `score` | 1080×1350 | `+20` + `30+ show gap` | `/how-scoring-works` | [`974-score-master.png`](./974-score-master.png) | https://www.canva.com/d/bnp8etxfYH_HA01 |
| `stat` | `stat` | 1080×1350 | figure + label | `/tour-stats` | [`974-stat-master.png`](./974-stat-master.png) | https://www.canva.com/d/BtRjEYVw0BtOAt0 |
| `line` | `line` | 1080×1350 | the `/about` sentence only | `/about` | [`974-line-master.png`](./974-line-master.png) | https://www.canva.com/d/iHB2w0iNeAOzbkT |

Stable keys are the **titles** and design ids:

- `score` — `DAHWI4tNpHY`
- `stat` — `DAHWIyXpOJU`
- `line` — `DAHWI4Tc5Lg`

MCP `edit_url` values rotate. Search the Canva account by title if a short link 404s.

Shared system (same as the menu / `docs/design.md`):

- Ground `#020617` (design.md `brand-bg-deep`). No full-bleed wordmark gradient.
- One teal `#2DD4BF` emphasis per frame.
- Supporting copy `#CBD5E1` (`content-secondary`).
- Vinyl mark at the bottom: repo `splash-vinyl-mark.webp` as Canva `MAHWI9qNlyI`. Do not redraw it. Do not pair it with the gradient wordmark on the same frame.
- Headline face on these copies is still **HK Grotesk Pro** (`format_text` cannot set Space Grotesk). Slot/body face is Inter.
- Forbidden on the image: song lists, predicted setlists, full-night recaps, a second layout invented in chat.

---

## Example fills (facts only)

### `score` — product fact, not a live Boost claim

`+20` on a **30+ show gap** is the scoring rule on `/how-scoring-works`. That is the locked example on the master.

Use this frame for:

1. **Scoring explain** (calendar 2026-09-29) — education. Caption must not say a Boost landed.
2. **Slot B** after a real Boost hit — then the caption may say the boost landed. Still no setlist.

### `stat` — live HTML 2026-09-24

Source: `https://www.setlistpickem.com/tour-stats/2026-summer-tour`

> Through 21 of 21 shows: **191 unique songs**, 20 bustouts highlighted below (aggregates only — not a full setlist archive).

The master shows **191** / `unique songs this tour`. Before the 2026-10-11 paste, re-read live `/tour-stats` (or the current tour slug). If Fall Tour is the default tour by then, swap the number and label to whatever that page actually shows. Do not invent a figure.

### `line` — shipped `/about` quote

Exact string from `src/features/landing/ui/AboutPageContent.jsx` / the cadence brief:

> Lock your picks, ride the scores, run with your crew—one show at a time.

The teal line on the PNG may render in the `slot-card` headline caps style. Brand Systems can toggle case in the Canva editor; the edit API cannot change font family or text-transform. Do not add the Beaver / Glu / Andy origin essay to the image. Max one origin post per calendar month.

---

## Caption seeds (Demand Gen)

UTMs stay playbook §6: `utm_medium=social`, `utm_campaign=seo_geo`, `utm_source` swapped per network. X is deferred (#1046). Facebook is not a post. Do not use the phrase “not a tip sheet” in public copy.

**Instagram / Threads — scoring explain (2026-09-29, layout `score`)**

```
Bustout Boost™ is +20 when a Phish pick hits a 30+ show gap. The longshot slot. How scoring works:
https://www.setlistpickem.com/how-scoring-works?utm_source=instagram&utm_medium=social&utm_campaign=seo_geo&utm_content=how-scoring-works
```

Threads: same body, `utm_source=threads`.

**Instagram / Threads — tour-stats (2026-10-11, layout `stat`)**

Re-check the figure the morning you paste.

```
Summer tour for pickers: 191 unique songs through 21 shows. Frequency and bustouts live on Tour Insights.
https://www.setlistpickem.com/tour-stats?utm_source=instagram&utm_medium=social&utm_campaign=seo_geo&utm_content=tour-stats
```

If the live page has moved on, rewrite only the number and the label. Keep the path and UTMs.

**Instagram / Threads — about (2026-10-14, layout `line`)**

```
Lock your picks, ride the scores, run with your crew—one show at a time.
https://www.setlistpickem.com/about?utm_source=instagram&utm_medium=social&utm_campaign=seo_geo&utm_content=about
```

Do not persist these to `crew/output/` or `approve` them here. Queue stays draft until EiC accepts the pair.

---

## How to fill a master

1. Social Media Specialist names the #1046 calendar row.
2. Brand Systems opens the matching title (`score` / `stat` / `line`) — do not `generate-design`.
3. Swap only the one line the menu allows (`+20`, the live figure, or the about sentence).
4. Export 1080×1350 PNG beside the pack.
5. Demand Gen writes the caption. EiC approves the pair. A human pastes.

---

## Refused / later

| Action | Why |
|--------|-----|
| Publish or share these designs | No EiC approval. Cadence brief is approved; these frames are not. |
| Live IG / Threads / X post | L2 queue + human paste. First how-it-works pack is already on PR #1047. |
| Canva Brand Template publish | None exist; creating Brand Templates is a Pro/Enterprise admin step, not this pack. |
| `lockup` / four highlight covers | Creative path: wait until a Story exists. |
| `generate-design` freestyle | Explicitly forbidden by the template menu. |
| Song lists / predicted setlists / night recaps | Cadence + #1046 out of scope. |
| New campaign or new layout id | Menu already covers the beats. |

---

## Acceptance for this pack (not for #974)

- [x] `score`, `stat`, and `line` exist as titled Canva designs copied from `slot-card`
- [x] Repo PNGs + this brief on disk
- [ ] Brand Systems eyeballs the three Canva files (caps on `line`, Inter on labels)
- [ ] EiC accepts each pair before paste
- [ ] 2026-10-11 `stat` figure re-read from live HTML
