# #973 — C6/C7 prediction + picks bridge (keyword URL)

**Status:** EiC-facing draft — title pattern approved 2026-08-21 (epic #972); this PR implements the tuned strings  
**Date:** 2026-09-02  
**Epic:** #972  
**Issue:** #973  
**Plan:** `content/marketing/pickem-search-plan-2026-08.md` § W2 (PR #971; not on staging yet)  
**Surface:** `/phish-setlist-prediction-game` only — **no** `/phish-picks` doorway  
**Pipeline:** marketing-specialist → brand-systems-partner → editor-in-chief → implementation  
**Copy ancestors:** `content/marketing/942-content-ia-drafts.md` (#940) · `PhishSetlistPredictionGamePageContent.jsx`

---

## Goal

Strengthen **one** URL. Bridge C6 (`phish setlist prediction`) and C7 (`phish picks` / `phish setlist picks`) onto the existing keyword landing without a new doorway. Keep the C1 (`phish setlist game`) win: **game** stays in title and H1.

---

## Title decision

| Source | String |
|--------|--------|
| Issue / EiC pattern (2026-08-21) | `Phish Setlist Prediction Game & Picks \| Setlist Pick'Em` |
| **Shipped (tuned)** | `Phish Setlist Prediction Game — Lock Your Picks \| Setlist Pick'Em` |

**Why tune:** `& Picks` reads like a sibling to phishpicks.net (tip-sheet / “Phish picks” brand). “Lock Your Picks” is our mechanic—six slots on a scored card—not a predicted full-night setlist. Prediction + picks + game all remain. Em dash avoids prerender HTML `&` escaping vs `verify:seo-prerender` literal title checks.

---

## Proposed / shipped strings

| Field | Copy |
|-------|------|
| Title | Phish Setlist Prediction Game — Lock Your Picks \| Setlist Pick'Em |
| H1 | The free Phish setlist prediction game *(keep — C1)* |
| Meta description | Free Phish setlist prediction game: lock your setlist picks—openers, closers, encore, and a wildcard—before showtime, score live, and compete with friends. Built for jam bands; live with Phish today, more soon. |

### First ~100 words (lede + definition open)

Setlist Pick'Em is a free live **setlist picks game** for fans who love predicting setlists—built first for Phish, designed as a home for more bands soon. Lock six Phish setlist picks—openers, closers, encore, and a wildcard—before showtime; score as the night unfolds. A **setlist prediction game**—sometimes called a **fantasy setlist** game—asks you to call songs and where they land in the setlist before the show. You compete in private pools and on the global leaderboard while scores update live.

### FAQ — What are Phish setlist picks?

**Answer (lock-slots-in-our-game, not a tip sheet):**

Phish setlist picks are the six calls you lock in Setlist Pick'Em before showtime: Set 1 opener and closer, Set 2 opener and closer, encore, and a wildcard. They are your card in this live prediction game—not a predicted full-night setlist or a tip sheet. Score as songs land, and compete in private pools or on the global board.

---

## Placement (do not stuff)

Per search plan § W2: prediction and picks appear in title *or* H1 *or* first paragraph—not identically in all three.

| Signal | Where |
|--------|--------|
| prediction + game | Title, H1, lede |
| picks | Title (“Lock Your Picks”), lede (“six Phish setlist picks”), FAQ |
| game (C1) | Title and H1 |

---

## Out of scope

- `/phish-picks` route (#975, gate is not green)
- Tip-sheet / predicted-setlist blog posts
- Chrome retokenize (#968)
- Tour-stats rewrite
- Dashboard IA (`src/app/layout/`, `dashboardPageMeta.js`, `docs/DASHBOARD_IA.md`)

---

## Implementation map

| Artifact | File |
|----------|------|
| This draft | `content/marketing/973-c6-c7-keyword-bridge.md` |
| Title / description / FAQ JSON-LD / prerender | `src/shared/config/seoRoutes.js` |
| H1 / lede / visible FAQ | `src/features/landing/ui/PhishSetlistPredictionGamePageContent.jsx` |
| Helmet | `src/pages/marketing/PhishSetlistPredictionGamePage.jsx` (reads `getPrerenderRoute`) |

---

## Human after promote

Spot-check SERP for C1 (`phish setlist game`) — still top-5. Agents cannot perform this check.
