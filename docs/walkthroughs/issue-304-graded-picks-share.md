# Walkthrough: Graded picks share card (issue #304)

This feature ships a **Wordle-style** graded picks summary once an official setlist exists (`actualSetlist` on `official_setlists/{date}`). Colors and points follow **`getSlotScoreBreakdown`** / **`ScoreBreakdownGrid`** so share output cannot drift from live scoring.

## Surfaces

### 1. Standings

1. Open **Dashboard → Standings** for a **graded** show (setlist loaded; scores visible).
2. Find your row (**You** badge / expanded breakdown).
3. Expand the row.
4. Below the six-slot breakdown, use **Share graded card**:
   - **Copy text grid** — monospace-friendly 2×3 letter codes (X/E/W/I/M) with per-slot points and ` BB` when **Bustout Boost™** applied (plain text; no emoji).
   - **Download PNG** — 2 rows × 3 columns, rounded tiles aligned with the in-app breakdown colors, per-slot points centered in each cell, amber **Bustout Boost™** pill when applicable.
   - **Share…** — Web Share API with PNG + caption when supported; falls back to text-only share or clipboard.

### 2. Picks

1. Open **Dashboard → Picks** for the same graded date.
2. With picks on file and the official setlist present, a **Share graded card** block appears **above** the pick fields.
3. Same three actions as Standings.

## Output semantics

| Slot result (kind) | PNG fill | Text code |
|--------------------|----------|-----------|
| Exact slot | Teal-tinted fill + teal border | `X` + points |
| Encore exact | Same teal family | `E` + points |
| Wildcard | Same teal family | `W` + points |
| In setlist (blue lane) | Blue-tinted fill + blue border | `I` + points |
| Miss / no pick | Muted panel fill | `M` + points or `—` when empty |
| Bustout Boost™ | Amber **frame** + pill label (PNG); suffix **` BB`** on that cell (text) | |

**Order** matches **`FORM_FIELDS`**: Set 1 Opener → Set 1 Closer → Set 2 Opener → Set 2 Closer → Encore → Wildcard (two rows of three).

## Implementation map

- Core: `src/features/scoring/model/gradedPicksShareCore.js` (slots, caption text, canvas PNG).
- Picks tab setlist load: `src/features/scoring/model/useOfficialSetlistForShow.js`.
- UI: `src/features/scoring/ui/GradedPicksShareBar.jsx`; wired from `LeaderboardRow` (self + graded) and `PicksPage`.

## Reference visuals

For this delivery, illustrative UI mockups were generated for the PR description (Standings expanded row + Picks tab + example PNG card). After merge, capture real screenshots from a graded show in dev or staging if you want this doc to embed live assets.
