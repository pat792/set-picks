# Walkthrough: Graded picks share card (issue #304)

Graded recap once an official setlist exists. Scoring colors come from **`getSlotScoreBreakdown`** so the card cannot drift from live scoring.

## Surfaces

### 1. Standings

1. **Dashboard → Standings** (graded show) → expand **your** row.
2. **Share graded card**
   - **Copy recap** — **Rich paste:** HTML includes the **PNG as a data-URL image** plus **setlistpickem.com** CTA. **Plain text:** **Artist · date** (from `SHARE_RECAP_ARTIST_NAME` in `gameConfig.js`, today `Phish`), total, a **2×3 grid of six colored squares only** (`🟩` / `🟦` / `⬛` / `🟧` for **Bustout Boost™**), one legend line, then the site URL.
   - **Download PNG** — full card; footer includes **setlistpickem.com · Free to play**.
   - **Share…** — image + succinct caption + **title** (headline not repeated in `text`, to avoid client merge bugs).

### 2. Picks

Same controls above the form when the show is graded.

## Marketing goal

Recap is **visual-first** (grid + PNG / embedded image) with a **single canonical CTA** to **https://www.setlistpickem.com/** so viewers can sign up or sign in.

## Implementation map

- `src/features/scoring/model/gradedPicksShareCore.js` — slots, PNG, plain body, `buildGradedPicksShareClipboardHtml` (data-URL img + link).
- `src/features/scoring/ui/GradedPicksShareBar.jsx` — renders PNG → data URL for clipboard HTML.
- `src/features/scoring/model/useOfficialSetlistForShow.js` — Picks tab setlist.

## Reference visuals

Capture real screenshots from a graded show in dev or staging if you want embedded images in this doc.
