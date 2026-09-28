# Comms review — `/phish-setlist-prediction-game`

**Status:** Draft — applied locally, awaiting Pat spot check (not yet on a branch / PR)  
**Date:** 2026-09-27  
**Epic:** #972 · **Refs:** #973 (C6/C7 bridge), #940 (page definition), #944 / #968 (chrome — untouched)  
**Skills:** editor-in-chief (voice gate) + marketing-specialist (keyword placement check)  
**Trigger:** "What are Phish setlist picks?" paragraph read as keyword-first, reader-second. Full-page pass requested.  
**Superseded in part by:** `marketing-voice-pass-2026-09.md` (same day) — the site-wide pass removed the em dashes this first rewrite still leaned on. Strings quoted below as "After" may differ slightly from what is in the JSX; the JSX is canonical.

---

## Verdict

The page was carrying its SEO weight in the sentence structure instead of the word choice. Every paragraph led with the exact-match phrase and then bolted the meaning on afterward (`the six calls you lock in Setlist Pick'Em`, `They are your card in this live prediction game`). The rewrite keeps every target phrase on the page, keeps the #973 placement rule (prediction / picks not stuffed identically in title + H1 + lede), and moves the phrases into sentences a fan would actually say.

**Not touched:** title, meta description, H1, CTA label. Those are EiC-approved SERP-tested strings from #973 (C1 `phish setlist game` still top-5). Re-open separately if we want to revisit.

---

## Keyword placement check (search plan § W2)

| Signal | Before | After | OK |
|--------|--------|-------|----|
| prediction + game | Title, H1, lede, §1 H2 | Title, H1, §1 H2 (lede now says "live game" — intentional, avoids triple-stack) | ✅ |
| picks (C7 `phish setlist picks`) | Title, lede, §2 H2 + body | Title, lede (bolded), §2 H2 + body | ✅ |
| game (C1) | Title, H1 | Title, H1, lede, §2 body ("That's the whole game") | ✅ |
| fantasy setlist (C5) | §1 body, §3 H2 | §1 body, §3 H2 | ✅ |
| Tip-sheet disambiguation (vs phishpicks.net) | §2 body | §2 body, plainer | ✅ |
| Phish-first / more bands | lede + §1 close (twice) | lede only | ✅ dedup |

---

## Before / after

### Lede

**Before**
> Setlist Pick'Em is a free live **setlist picks game** for fans who love predicting setlists—built first for Phish, designed as a home for more bands soon. Lock six Phish setlist picks—openers, closers, encore, and a wildcard—before showtime; score as the night unfolds.

**After**
> Setlist Pick'Em is a free, live game for fans who love calling the show. Lock six **Phish setlist picks** before showtime—openers, closers, encore, and a wildcard—then watch your score move as the night unfolds. Phish is up first; more bands are on the way.

Why: "free live setlist picks game" is a four-word noun stack. "for fans who love predicting setlists" restates the noun it modifies. Two em-dash pairs in two sentences. The bold moved from the generic phrase to the C7 phrase, which is the one this page is bridging.

### §1 — What is a setlist prediction game?

**Before**
> …asks you to call songs and where they land in the setlist before the show. You compete in private pools and on the global leaderboard while scores update live.

**After**
> …asks you to call which songs get played, and where they land, before the show starts. Then you compete in private pools and on the global leaderboard as scores update live.

Figure caption: `Compete on show and tour boards. Live setlist and standings during the show, and archived history so you never miss a tour moment.` → `Show and tour leaderboards: live setlist and standings during the show, full history after.`

Bullets: `Call slots (openers, closers, encore, wildcard)` → `Call your slots: openers, closers, encore, and a wildcard` · `Score live as songs are played` → `Score live as each song is played` · `Climb show and tour boards with friends, and everyone playing the game on the global leaderboard` → `Climb show and tour boards against your friends—and everyone else on the global leaderboard`

Close: dropped the second "live with Phish today / more bands soon" (already in lede). `turns that ritual into a live game.` → `turns that ritual into a live game with a scoreboard.`

### §2 — What are Phish setlist picks? (the flagged paragraph)

**Before**
> Phish setlist picks are the six calls you lock in Setlist Pick'Em before showtime: Set 1 opener and closer, Set 2 opener and closer, encore, and a wildcard. They are your card in this live prediction game—not a predicted full-night setlist or a tip sheet. Score as songs land, and compete in private pools or on the global board.

**After**
> Your Phish setlist picks are the six calls you lock before the lights go down: the Set 1 opener and closer, the Set 2 opener and closer, the encore, and one wildcard. That's the whole game—you're not writing out a full predicted setlist or following a tip sheet. When a song lands in one of your slots, you score, and your pool and the global leaderboard update in real time.

Why: "lock in Setlist Pick'Em" collides the phrasal verb *lock in* with the preposition. "They are your card in this live prediction game" leans on an unexplained metaphor and re-stuffs *prediction game* a fourth time. The tip-sheet contrast is the important idea (phishpicks.net disambiguation) and now gets a plain sentence of its own. Last sentence was a repeat of the lede; replaced with the actual mechanic (slot lands → you score → boards move).

### §3 — Fantasy setlists, without the spreadsheet

**Before**
> We track points for slot hits, wildcards, and Bustout Boost™ longshots automatically. Full values: how scoring works.

**After**
> Points for slot hits, wildcards, and Bustout Boost™ longshots are tallied automatically—no spreadsheet, no arguing over who's keeping score. The full point values are on how scoring works.

Why: the H2 promises "without the spreadsheet" and the body never paid it off. "Full values:" is a label, not a sentence.

Bullets: `lock picks` → `lock your picks` · `final grades, tour standings, personal stats` → added the missing "and".

Tour-stats para: `Tour stats (frequency, bustouts, gaps) refresh every night the band plays live. Playing unlocks personal stats—picking average, Bustout Boost™ hits, and your pick heatmap.` → `Tour stats—song frequency, bustouts, and gaps—update every night the band plays. Playing unlocks your own numbers too: picking average, Bustout Boost™ hits, and a heatmap of your most frequent picks.` ("plays live" is redundant; parenthetical list → em-dash list matches the page's punctuation.)

### §4 — How to play

1. `Create a free account—tonight's setlist card opens.` → `Create a free account and open the card for the next show.` (accurate on off-nights)
2. `Pick Set 1 opener/closer, Set 2 opener/closer, encore, and wildcard.` → `Pick your Set 1 opener and closer, Set 2 opener and closer, encore, and wildcard.` (slashes → words; matches §2)
3. `Watch scores update live; climb boards or invite a private pool.` → `Watch scores update live, climb the boards, or start a private pool with friends.` (you invite friends, not a pool)

---

## Files changed

| Surface | File | What |
|---------|------|------|
| Visible copy | `src/features/landing/ui/PhishSetlistPredictionGamePageContent.jsx` | lede, §1–§4 body, caption, bullets, steps |
| Crawler prerender | `src/shared/config/seoRoutes.js` → `PRERENDER_ROUTES` keyword entry `paragraphs[]` | mirrors lede / §1 / §2 / tour-stats para |
| FAQ JSON-LD | `src/shared/config/seoRoutes.js` → `buildKeywordIntentPageJsonLd` Q1 + Q2 answers | now match visible text (rich-result guideline: answer must appear on page) |

Unchanged: `KEYWORD_PAGE_TITLE`, `KEYWORD_PAGE_DESCRIPTION`, H1, JSON-LD Q3–Q5, CTA, chrome tokens, `PhishSetlistPredictionGamePage.jsx` Helmet.

---

## Ship checklist (when Pat signs off)

- [ ] Branch `feat/<issue#>-keyword-page-comms-pass` off `staging`
- [ ] PATCH bump (copy only) + `CHANGELOG.md` Changed entry
- [ ] `npm run lint && npm test && npm run verify:seo-prerender`
- [ ] Update `content/marketing/README.md` row for this doc; mark `973-c6-c7-keyword-bridge.md` FAQ answer as superseded by this file
- [ ] Human after promote: SERP spot-check C1 `phish setlist game` still top-5 (agents cannot do this)
