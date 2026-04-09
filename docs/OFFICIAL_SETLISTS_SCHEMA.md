# Official setlists: Firestore schema and scoring

Canonical reference for `official_setlists/{showDate}` documents, how scoring consumes them, how external APIs map in, and how **Save** differs from **Finalize and rollup**.

---

## Collection and document ID

- **Collection:** `official_setlists`
- **Document ID:** `showDate` in **`YYYY-MM-DD`** (same string used on `picks.showDate` and admin show picker).

---

## Core fields (game + scoring)

| Field | Type | Role |
|--------|------|------|
| `setlist` | `Record<string, string>` | **Position / slot answers** — keys are game slot IDs from `FORM_FIELDS` in `src/shared/data/gameConfig.js` (e.g. `s1o`, `s1c`, `s2o`, `s2c`, `enc`, `wild`). Values are song titles as entered for that slot. Used for **exact-slot** and **encore-exact** scoring. |
| `officialSetlist` | `string[]` | **Ordered full-show song list** as played. Merged with slot values when building “everything that counted as played” for **in-setlist** and **wildcard** scoring. |

**Naming note:** In everyday language “setlist” means the whole show. In Firestore, `setlist` is **only** the slot map; `officialSetlist` is the **chronological** list. Both are authoritative for different scoring paths. A future optional rename to `positionSlots` / `playedSongOrder` is tracked in [#145](https://github.com/pat792/set-picks/issues/145).

### Other metadata on the same document

Written on save from `saveOfficialSetlistByDate` (`src/features/admin/api/officialSetlistsApi.js`):

| Field | Purpose |
|--------|---------|
| `showDate` | Same as document ID (redundant but explicit). |
| `status` | e.g. `'COMPLETED'` when saved via admin flow. |
| `isScored` | Reserved flag (currently written `false` on admin save). |
| `updatedAt` | ISO timestamp string. |
| `updatedBy` | Admin email (or null). |

---

## How scoring uses `setlist` + `officialSetlist`

### Client and Cloud Function (keep in sync)

- **Client:** `buildAllPlayedNormalized` in `src/shared/utils/scoring.js` collects normalized song titles from:
  - every string entry in the flat map **except** keys in `NON_SONG_SETLIST_KEYS` (`officialSetlist`, `id`, `bustouts`);
  - plus every string in `officialSetlist`.
  - Result is **deduped** (Set).
- **Cloud Function:** `buildAllPlayedNormalized` in `functions/index.js` mirrors the same rules for `gradePicksOnSetlistWrite`.

### Per-slot logic (summary)

- **Exact slot / encore exact:** compare user pick to `actualSetlist[fieldId]` (from the slot map).
- **In setlist:** guess appears in `buildAllPlayedNormalized(actualSetlist)` but is not an exact slot match.
- **Wildcard:** guess must appear in that merged “all played” set.
- **Bustout boost:** applied on top when catalog metadata matches (shared `PHISH_SONGS` / function copy).

Detailed points and UI breakdown kinds: `getSlotScoreBreakdown` in `src/shared/utils/scoring.js`.

---

## Triggers and pick documents

### `gradePicksOnSetlistWrite` (`functions/index.js`)

- **Trigger:** `onDocumentWritten` on `official_setlists/{showDate}`.
- **Behavior:** For every `picks` doc with `showDate` equal to that id, recompute `score` from `picks.picks` and the new official setlist payload (`setlist` spread + `officialSetlist` array).
- **Graded state:** This path is **live scoring only**. It does **not** set `isGraded`. If the pick is not graded, it clears `gradedAt`; it does not flip `isGraded` to true here (see finalize below).

### `picks/{pickId}` (relevant fields)

- `showDate` — ties pick to the official setlist doc.
- `picks` — slot guesses (same IDs as `FORM_FIELDS`).
- `score` — total points (updated by the Cloud Function on setlist writes and again during rollup).
- `isGraded` / `gradedAt` — set when admin runs **Finalize and rollup** (not on ordinary save).

---

## Save vs finalize (admin)

Both paths call `saveOfficialSetlistByDate` first (Firestore write to `official_setlists`), which triggers `gradePicksOnSetlistWrite` and refreshes **live** `score` on picks.

| Action | Admin UI | After save |
|--------|-----------|------------|
| **Save official setlist** | `handleSave` | Setlist persisted; Cloud Function updates `pick.score` only. |
| **Finalize and rollup** | `handleFinalizeAndRollup` | Same save, then `rollupScoresForShow` (`src/features/admin/api/adminRollupApi.js`): sets `isGraded: true`, sets `gradedAt` on first grade, increments `users.totalPoints` by score delta and `users.showsPlayed` when newly graded. |

So: **Save** = official answers + live scores. **Finalize** = lock into graded stats and profile counters.

---

## External API → Firestore

Adapters fetch raw JSON (Phish.in / Phish.net; optionally via callable `getPhishnetSetlist` for production keys — see `README.md`).

- **Parser:** `parseSetlist` in `src/features/admin-setlist-config/model/setlistParser.js` returns an internal DTO:
  - `positionSlots` — slot ID → title (conceptually same as persisted `setlist`).
  - `playedSongOrder` — string[] (conceptually same as persisted `officialSetlist`).
- **Persistence:** `useSetlistAutomation` / admin form maps that DTO into `setlist` and `officialSetlist` before `saveOfficialSetlistByDate`.

Network layer: `src/features/admin-setlist-config/api/phishApiClient.js`.

---

## Related code (quick index)

| Area | Location |
|------|-----------|
| Admin load/save official doc | `src/features/admin/api/officialSetlistsApi.js` |
| Save vs finalize orchestration | `src/features/admin/model/useAdminSetlistForm.js` |
| Rollup / profile stats | `src/features/admin/api/adminRollupApi.js` |
| Standings read shape | `src/features/scoring/api/standingsApi.js` (`fetchOfficialSetlistForShow`) |
| Client scoring | `src/shared/utils/scoring.js` |
| Setlist write trigger | `functions/index.js` — `gradePicksOnSetlistWrite` |

---

## Epic

Part of **#42** — automated setlist API integration; this doc is the canonical schema for show results as stored today.
