# Walkthrough: Graded picks share card (issue #304)

This feature ships a graded recap once an official setlist exists (`actualSetlist` on `official_setlists/{date}`). Colors and points follow **`getSlotScoreBreakdown`** / **`ScoreBreakdownGrid`** so share output cannot drift from live scoring.

## Surfaces

### 1. Standings

1. Open **Dashboard → Standings** for a **graded** show (setlist loaded; scores visible).
2. Find your row (**You** badge / expanded breakdown).
3. Expand the row.
4. Below the six-slot breakdown, use **Share graded card**:
   - **Copy recap** — writes **plain text** (headline once + human-readable lines per slot using the same result labels as the app) plus **`text/html`** when the browser supports it, so Mail / Notes / Slack often show a **small color grid** when you paste. Also includes a **Unicode block** mini-grid (`█` / `▓` / `░`, not emoji) for plain SMS.
   - **Download PNG** — 2 rows × 3 columns, rounded tiles, per-slot points, **Bustout Boost™** pill when applicable.
   - **Share…** — Web Share uses **`title`** = recap headline and **`text`** = body **without** repeating that headline (many apps merge title + body without a newline and would corrupt or duplicate lines).

### 2. Picks

1. Open **Dashboard → Picks** for the same graded date.
2. With picks on file and the official setlist present, a **Share graded card** block appears **above** the pick fields.
3. Same three actions as Standings.

## Plain text vs color

- **SMS / plain clients:** Readable slot lines + block legend; attach **PNG** for the full color card.
- **Rich paste:** Prefer **Copy recap** into apps that accept HTML from the clipboard.
- **Icons:** Lucide only exists in the React app; the recap uses **canvas PNG**, **inline-styled HTML**, and **Unicode block characters** (geometric, not colorful emoji) for plain-text “tiles.”

## Implementation map

- Core: `src/features/scoring/model/gradedPicksShareCore.js` (slots, plain body, HTML, canvas PNG).
- Picks tab setlist load: `src/features/scoring/model/useOfficialSetlistForShow.js`.
- UI: `src/features/scoring/ui/GradedPicksShareBar.jsx`; wired from `LeaderboardRow` (self + graded) and `PicksPage`.

## Reference visuals

For this delivery, illustrative UI mockups were generated for the PR description (Standings expanded row + Picks tab + example PNG card). After merge, capture real screenshots from a graded show in dev or staging if you want this doc to embed live assets.
