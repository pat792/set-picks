# Walkthrough: Graded picks share card (issue #304)

This feature ships a **Wordle-style** graded picks summary once an official setlist exists (`actualSetlist` on `official_setlists/{date}`). Colors and points follow **`getSlotScoreBreakdown`** / **`ScoreBreakdownGrid`** so share output cannot drift from live scoring.

## Surfaces

### 1. Standings

1. Open **Dashboard → Standings** for a **graded** show (setlist loaded; scores visible).
2. Find your row (**You** badge / expanded breakdown).
3. Expand the row.
4. Below the six-slot breakdown, use **Share graded card**:
   - **Copy text grid** — emoji-ish 2×3 grid with per-slot points and a bustout marker (`⭐`).
   - **Download PNG** — 2 rows × 3 columns, color-first cells, per-slot points, amber **Bustout** label when the bustout boost applied.
   - **Share…** — Web Share API with PNG + caption when supported; falls back to text-only share or clipboard.

### 2. Picks

1. Open **Dashboard → Picks** for the same graded date.
2. With picks on file and the official setlist present, a **Share graded card** block appears **above** the pick fields.
3. Same three actions as Standings.

## Output semantics

| Slot result (kind) | PNG fill | Text tile |
|--------------------|----------|-----------|
| Exact / encore exact / wildcard | Teal family | 🟩 |
| In setlist (blue lane) | Blue family | 🟦 |
| Miss / empty | Muted slate | ⬛ |
| Bustout boost | Amber **border** + “Bustout” chip (PNG); `⭐` adjacent to emoji (text) | |

**Order** matches **`FORM_FIELDS`**: Set 1 Opener → Set 1 Closer → Set 2 Opener → Set 2 Closer → Encore → Wildcard (two rows of three).

## Implementation map

- Core: `src/features/scoring/model/gradedPicksShareCore.js` (slots, caption text, canvas PNG).
- Picks tab setlist load: `src/features/scoring/model/useOfficialSetlistForShow.js`.
- UI: `src/features/scoring/ui/GradedPicksShareBar.jsx`; wired from `LeaderboardRow` (self + graded) and `PicksPage`.

## Reference visuals

For this delivery, illustrative UI mockups were generated for the PR description (Standings expanded row + Picks tab + example PNG card). After merge, capture real screenshots from a graded show in dev or staging if you want this doc to embed live assets.
