# Marketing copy voice pass — all public pages

**Status:** Shipping in 1.75.3 (`feat/972-marketing-voice-pass`)  
**Date:** 2026-09-27  
**Refs:** epic #972 · #973 · #940 · #941 · #937 · #944 / #968 (chrome untouched)  
**Skills:** editor-in-chief (voice gate) · marketing-specialist (keyword placement) · external calibration against fan press (see below)  
**Companion:** `keyword-page-comms-review-2026-09.md` (the `/phish-setlist-prediction-game` pass that started this; its before/after detail is not repeated here)

---

## Why

The keyword page review surfaced a pattern that runs across every marketing surface: the copy reads like it was generated. The most visible tell is em dash density (86 across the marketing JSX + `seoRoutes.js` before this pass, roughly one every other sentence). Behind that sit a handful of other habits that fan press never uses. This pass removes them everywhere a reader or crawler sees body copy.

## Calibration: what fan writing actually sounds like

Read before rewriting: phish.net user reviews of 9/4–9/6/26 Dick's, the Live For Live Music recaps of the same run, and a Substack show review. Shared traits:

| Fan press does | Fan press does not |
|---|---|
| Concrete nouns: venue, slot number, gap count, show count ("in the 2 slot", "a 2,051-show drought", "17-minute Ghost") | Abstract benefit language ("elevate", "seamless", "unlock", "make every show count") |
| Fan verbs: got the call, landed, dropped into, closed it out, let rip, on tap, bustout, type II | Product verbs: unlock, track, leverage, experience |
| Commas, colons, parentheses, periods. Sentence length varies a lot. | Em dashes as the default joint. Matched-pair em dashes mid-sentence. |
| Plain opinion, some wryness ("eye roll, Everything's Right") | Hedged triplets ("whether you're at the venue, on couch tour, or anywhere in between") |
| One idea per sentence, then move on | Restating the noun in its own modifier ("a picks game for fans who love picking") |
| Parenthetical asides for nicknames and context: "Ryan M (Beaver to his friends)" | Em-dash appositive pairs: "Ryan M—known to friends as Beaver—" |

## AI tells removed (site-wide)

| Tell | Before → After (count) | Rule applied |
|---|---|---|
| Em dashes in rendered prose | ~50 → **3** (all three are the brand tagline "…run with your crew—one show at a time," which is a single deliberate dash and stays) | Default joint is a period, comma, colon, or parentheses. One em dash per page maximum, and only when it earns it. |
| Label-dash-sentence list items (`**Before the show** — Open…`) | 5 → 0 | Bold label ends in a period. `**Before the show.** Open the card…` |
| Punchy two-fragment pairs ("Same picks. Different rivalries.") | 2 → 0 | Replaced with a concrete fact: "Same six picks, two scoreboards." |
| "unlock" as the verb for personal stats | 17 → 0 in prose (remains only in `HOW_IT_WORKS_DESCRIPTION`, out of scope) | "start building", "start counting", "pick up another show", "you get your own numbers" |
| "—and more bands soon" bolted onto every sentence about Phish | Deduped to once per page | "Phish is up first; more bands are on the way." / "with more bands on the way." |
| "refresh every night the band plays live" | 8 → 0 | "update every night the band plays." ("plays live" is redundant) |
| Cliché tails ("make every show count", "across the tour and beyond", "rewarding strategic picks over heavy rotation") | Removed or made concrete | "That's the reward for digging past the heavy rotation." |
| Slash lists in prose ("Set 1 opener/closer") | 2 → 0 | Words: "Set 1 opener and closer" |

## Per-surface changes

### `/` splash (`SplashHeroSection`, `SplashHowItWorksSection`, `SplashAboutSection`)
- Tagline: `The free Phish setlist prediction game — live on tour.` → `The free Phish setlist prediction game. Live on tour.` (also prerender `paragraphs[0]` and sr-only H1, which now use a colon)
- Hero P3: dropped "make every show count"; "to play at the show and on couch tour" → "you can play from the venue or from couch tour"
- Card 1: "Earn points for correct picks, higher points for exact slot picks, plus a Bustout Boost™ for calling longshots" → "Correct picks earn points, exact slots earn more, and a Bustout Boost™ pays out when you call a longshot."
- Card 2: `See your picks—and your friends'—light up` → `Watch your picks and your friends' picks light up`
- Card 3: dropped "—across the tour and beyond"
- About blurb: `Born on Phish tour in 2001—from paper picks to spreadsheets to a live…` → `Born on Phish tour in 2001. Paper picks became a spreadsheet, and the spreadsheet became a live setlist prediction game for friends and crews.`
- **Kept:** Lock It In / Watch It Unfold / Claim the Crown card titles (brand, mirrored in HowTo JSON-LD). Brand tagline quote.

### `/how-it-works` (`HowItWorksPageContent`)
- Lede: `for Phish fans—and a home for more bands soon` → `for Phish fans, with more bands on the way`
- Carousel captions: dashes → colon / period; "Total / Gap / Last" → "Total, Gap, and Last played on every song"
- Timeline items: bold label + period; "Peek at tour stats … that refresh every night the band plays live" → "Want an edge? Check tour stats first (song frequency, bustouts, gap highlights). They update every night the band plays."
- "Follow the live setlist in the app, whether you're at the venue or on couch tour" → "from the venue or from couch tour"
- "Same picks. Different rivalries." → "Same six picks, two scoreboards."
- H2 "Personal stats unlock when you play" → "Personal stats build as you play"; body `Your personal story—picking average, Bustout Boost™ hits, pick heatmaps—unlocks as you earn points` → `Your own numbers (picking average, Bustout Boost™ hits, pick heatmap) start building the first night you play.`

### `/how-scoring-works` (`HowScoringWorksPage`, `ScoringRulesContent`)
- Figure caption + alt: dash → colon
- Exact slot: `lands on the exact slot you chose — Set 1…` → `lands in the exact slot you called: Set 1…`
- Bustout Boost™: `on top of base points — rewarding strategic picks over heavy rotation.` → `on top of base points. That's the reward for digging past the heavy rotation.`
- Note: `ScoringRulesContent` is shared with the dashboard scoring modal, so the modal picks up the same two sentences. Same content, no layout change.

### `/about` (`AboutPageContent`)
- P1: `In 2001, on Phish tour that summer, Ryan M—known to friends as Beaver—cooked up…` → `On Phish summer tour in 2001, Ryan M (Beaver to his friends) cooked up…`; `shaped the ritual—debating picks` → `shaped the ritual: debating picks`
- P2: `Suddenly every placement mattered—friendly competition…` → two sentences
- P3: `cities—portable, easy to update` → `cities. Portable, easy to update`
- P4: `Live with Phish today—building toward more bands soon.` → `Live with Phish today, with more bands on the way.`
- **Kept:** the bolded proper nouns (#941 design decision). Flagging: heavy inline bold on every noun is itself a tell. Worth a separate look, not changed here.

### `/tour-stats*` (`PublicTourStatsPanel`, dark product chrome, copy only)
- Header: `…that help you stay sharp between shows—updated every night the band plays live.` → `…that keep you sharp between shows. Updated every night the band plays.`
- Footer: `Tour-wide trends only—not a night-by-night archive. Playing unlocks personal stats.` → `Tour-wide trends only, not a night-by-night archive. Play and your personal stats start counting.`

### `/phish-setlist-prediction-game`
- Second pass on top of `keyword-page-comms-review-2026-09.md`: removed the 10 em dashes the first pass had left in (my own rewrite leaned on them too). Definition now uses parentheses: `A setlist prediction game (some fans call it a fantasy setlist game) asks you…`

### `seoRoutes.js` (crawler prerender `paragraphs[]`, FAQ JSON-LD answers, HowTo step text)
- Every paragraph mirrors the visible copy above.
- FAQ answers de-dashed: home Bustout Boost, scoring encore + Bustout Boost, keyword Q1–Q3.
- HowTo step 3 / 4 on `/how-it-works`: "Same six picks, two scoreboards." / "start building the first night you play."
- Home prerender `h1`: dash → colon (matches sr-only H1).

## Deliberately not touched

| Surface | Why |
|---|---|
| All `*_TITLE` and `*_DESCRIPTION` constants (SERP title + meta description) | EiC-approved, SERP-tested strings (#973 title pattern; C1 top-5 evidence). Several contain em dashes and "unlock". Changing `SEO_CONFIG.defaultDescription` also requires `index.html`, `og-home-html.mjs`, `api/inviteOgHelpers.mjs` (`verify:seo-strings`). **Recommend a separate, SERP-aware pass** once this one ships and we have a GSC baseline. |
| Brand tagline "Lock your picks, ride the scores, run with your crew—one show at a time." | One dash, deliberate, appears 3× (splash ×2, about). |
| Card titles Lock It In / Watch It Unfold / Claim the Crown | Brand; mirrored in HowTo JSON-LD. |
| `og:image:alt` strings | Not rendered; low value. |
| `/privacy`, `/terms` | Legal copy. |
| `PhishSetlistPredictionGamePageContent.copy.md` | Already marked superseded; history only. |
| `public/llms.txt` | Separate GEO surface; check after this ships. |

## Verification

- `eslint` on all touched files: clean
- `npm run build && npm run verify:seo-prerender`: OK (paragraph excerpts confirmed in `dist/`)
- `npm run verify:seo-strings`: OK (home description unchanged)
- `npm run verify:dashboard-ui`: OK
- `vitest` landing / scoring / tour-stats / shared config: 32 files, 185 tests pass
- Visual: `/phish-setlist-prediction-game`, `/how-it-works`, `/about` on local dev

## Files changed

```
src/features/landing/ui/SplashHeroSection.jsx
src/features/landing/ui/SplashHowItWorksSection.jsx
src/features/landing/ui/SplashAboutSection.jsx
src/features/landing/ui/HowItWorksPageContent.jsx
src/features/landing/ui/AboutPageContent.jsx
src/features/landing/ui/PhishSetlistPredictionGamePageContent.jsx
src/pages/marketing/HowScoringWorksPage.jsx
src/features/scoring/ui/ScoringRulesContent.jsx
src/features/tour-stats/ui/PublicTourStatsPanel.jsx
src/shared/config/seoRoutes.js
content/marketing/keyword-page-comms-review-2026-09.md
content/marketing/marketing-voice-pass-2026-09.md   (this file)
```

## Ship checklist (after spot check)

- [ ] Branch `feat/<issue#>-marketing-voice-pass` off `staging`
- [ ] PATCH bump (copy + CI guard; no API surface) + `CHANGELOG.md` Changed / Added entries
- [x] `content/marketing/README.md` rows for the review docs + voice guide
- [ ] Human after promote: SERP spot-check C1 `phish setlist game` still top-5

---

## Skill update (applied 2026-09-27, approved by Pat)

The social skills got a voice section this month via `974-owned-social-cadence-brief.md`. The marketing/editorial skills had nothing equivalent, which is how the page copy drifted. Applied: one short shared voice reference, referenced from the skills that produce or gate prose, plus a CI guard.

| Item | Where |
|---|---|
| Voice guide | `content/marketing/voice-guide.md` |
| Skill "Read first" + mandate lines | `.cursor/skills/editor-in-chief`, `marketing-specialist`, `comms-drafter`, `brand-systems-partner` |
| CI guard | `scripts/verify-marketing-voice.mjs` → `npm run verify:marketing-voice` → `.github/workflows/ci.yml` `verify` job (after `verify:seo-strings`) |

Guard behavior: scans JSX text in `landing/ui`, `pages/marketing`, `ScoringRulesContent`, `PublicTourStatsPanel`, plus `PRERENDER_ROUTES` h1 / paragraphs / JSON-LD `text`. Fails on >6 em dashes site-wide (tagline allowlisted), any banned phrase, any `</strong> —` item, or unlock/leverage/empower in prerender + JSON-LD text. Skips comments, attribute strings, and meta descriptions. Verified: passes on current copy (0/6); fails with 18 findings on the pre-pass `HowItWorksPageContent.jsx`.

The original proposal text follows for the record.

### New file: `content/marketing/voice-guide.md`

```markdown
# Voice guide (marketing + editorial prose)

Read fan press before writing: phish.net reviews, Live For Live Music recaps,
JamBase. Write like that, about our product.

## Do
- Concrete nouns: venue, slot, gap count, show count, point value.
- Fan verbs: call, lock, land, got the call, closed it out, bustout.
- Commas, colons, parentheses, periods. Vary sentence length.
- Parentheses for nicknames and asides: "Ryan M (Beaver to his friends)".
- Say the Phish-first / more-bands line once per page.

## Do not
- Em dashes as the default joint. Max one per page, and only if a comma or
  period would lose meaning. Never a matched pair mid-sentence.
- "unlock", "elevate", "seamless", "experience", "make every show count".
- Bold-label-dash-sentence list items. Use `**Label.** Sentence.`
- Two-fragment punch lines ("Same picks. Different rivalries.").
- Restating the noun in its modifier ("a picks game for fans who love picking").
- Slash lists in prose ("opener/closer").
- Hedged triplets ("at the venue, on couch tour, or anywhere in between").

## Check before handoff
rg -c "—" on the touched JSX and seoRoutes paragraphs. If the number went up,
you are not done.
```

### Skill edits (one line each)

- `editor-in-chief/SKILL.md` → **Read first** add `content/marketing/voice-guide.md`; **Mandate** add: "Reject any pack or page copy that fails the voice guide's Do-not list before it reaches L2 or a PR."
- `marketing-specialist/SKILL.md` → **Read first** add `content/marketing/voice-guide.md`.
- `comms-drafter/SKILL.md` → **Read first** add `content/marketing/voice-guide.md` (lifecycle email/push shares the problem).
- `brand-systems-partner/SKILL.md` → **Mandate**: voice guide is part of the shared system alongside `social-brand-approach.md`.

### Optional CI guard

A tiny `scripts/verify-marketing-voice.mjs` that counts `—` and `&mdash;` in `src/features/landing/ui/*.jsx` + `PRERENDER_ROUTES[].paragraphs` and fails above a threshold (say 6 site-wide, excluding the tagline). Cheap, and it stops the drift from coming back through the next agent PR. Would wire into `verify` next to `verify:seo-prerender`.
