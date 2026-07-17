# Profile stats — Sprint 9 foundation (#553 / #554)

**Train:** [Sprint 9 release train](../RELEASE_TRAIN_SPRINT_9.md) Wave 2  
**Status:** Spec locked for implementation; UI ships in follow-up PRs.

---

## Goals

| Issue | Deliverable |
|-------|-------------|
| [#554](https://github.com/pat792/set-picks/issues/554) | Richer profile averages: avg points / show, avg correct / show, avg song vintage |
| [#553](https://github.com/pat792/set-picks/issues/553) | Personalized picks heatmap (frequency-forward); design spike before committing to one viz |

Shared constraint: prefer existing rollups / bounded reads over unbounded `picks` history scans. See [`docs/PROFILE_STATS_READ_COST.md`](../PROFILE_STATS_READ_COST.md).

---

## #554 — Formulas and windows

### Time window (v1)

- **Career (all graded shows)** for public profile and self Profile stats strip.
- Tour-scoped averages may reuse `users/{uid}.seasonStats.{tourKey}` later; not required for v1.

Inclusion rule matches existing season stats: graded, non-empty picks only (`pickCountsTowardSeason` / profile season compute).

### Metrics

| Metric | Formula | Data today | Notes |
|--------|---------|------------|-------|
| **Avg points / show** | `totalPoints / shows` when `shows > 0` | `users.totalPoints` + `users.showsPlayed` (or live `useUserSeasonStats`) | Zero reads beyond current profile stats path |
| **Avg correct picks / show** | Mean over graded shows of (exact-slot + wildcard hits counting as product decides) / slots-per-show | Needs per-show scorecard or pick+setlist join | **Do not** scan all picks on every profile view. Prefer a rollup field (e.g. `careerCorrectSlots` / `careerShows`) written at finalize, or a one-shot React Query cache keyed by uid with documented read budget |
| **Avg song vintage** | Mean (or median — ship mean first) of song **debut year** (or years-since-debut) across unique songs picked, or across all pick slots — pick one and document in UI | Phish.net `songs.json` has `debut`; our Storage catalog does **not** yet | See vintage source below |

### Avg correct — product default (v1)

- Count a slot as correct when `getSlotScoreBreakdown` / scoring would award > 0 for that slot (exact, in-setlist wildcard, or bustout boost as applicable).
- Denominator: fixed pick-slot count (FORM_FIELDS length), not only filled slots.
- Defer pool-scoped correctness.

### Avg vintage — source decision (locked)

1. **Source of truth:** Phish.net v5 `songs` rows include `debut` (YYYY-MM-DD or year string) — confirmed via API consumer docs (`debut`, `debut_permalink`).
2. **Publish path:** Extend `song-catalog.json` payload in `functions/phishnetSongCatalog.js` to include `debut` (string, may be empty). Keep `name`, `total`, `gap`, `last`.
3. **Client:** `useSongCatalog` already loads the catalog; map `name → debut` for vintage aggregation.
4. **Fallback:** Bundled `phishSongs.js` may omit debut → treat as unknown; exclude unknowns from mean and show “n of m songs dated” in UI.
5. **Do not** use catalog `gap` / `last` as vintage — those are live catalog state, wrong for “how old is this song.”

SemVer: adding `debut` to the published catalog JSON is a **MINOR** (new catalog field; document in `docs/SONG_CATALOG.md` + `docs/API.md` if catalog is listed).

### Read-cost budget (#554)

| Metric | Budget |
|--------|--------|
| Avg points | **0** extra reads (derive from existing stats) |
| Avg correct | Prefer **0** on profile view via rollup; if live: max one historical picks query plan documented before merge, with telemetry |
| Avg vintage | Catalog already cached (3-day localStorage); join in memory against user’s pick titles — titles may require pick history (**same budget as avg correct / heatmap**) |

---

## #553 — Heatmap design spike (pre-UI)

### Recommended v1 viz (locked for first PR)

**Ranked “top picks” intensity strip**, not a full songs×shows matrix:

- Rows: top N songs by pick **frequency** (default N = 10).
- Intensity: frequency count (primary).
- Secondary chips or columns: correct count, exact-slot hits, wildcard hits, bustout boosts — show what is cheap; defer expensive columns with UI “—” + tooltip.

Rationale: glanceable on mobile Profile; avoids huge grid; maps cleanly to a single aggregation pass.

### Deferred viz

- Songs × shows calendar heatmap
- Songs × slots matrix

Revisit after v1 ships if users want coverage over time.

### Aggregation sketch

Input: graded picks for uid (same inclusion as season stats).

Per song title (normalized):

- `pickedCount`
- `correctCount` (any slot score > 0 for that title)
- `exactSlotHits`
- `wildcardHits`
- `bustoutBoosts`

Output: sorted by `pickedCount` desc, take top N.

### Read-cost budget (#553)

- Prefer a **server rollup** `users/{uid}.pickSongStats` (or subcollection) updated at finalize — profile becomes 1 point read.
- Interim spike may live-compute for **self Profile only** with hard cap (e.g. last K tour shows) and `profile_pick_heatmap_computed` GA4 event mirroring #220 thresholds.
- Public profile heatmap: ship only after rollup or prove read budget ≤ season-stats live path.

---

## Implementation order (Wave 2)

1. **This doc** (train kickoff) — merged (#617).
2. **#554 slice A:** Surface avg points on Profile + public profile (derive from existing stats) — PATCH — merged (#618, 1.24.1).
3. **#554 slice B:** Catalog `debut` field + avg vintage helpers — MINOR (1.25.0). UI when pick titles available (with slice C / #553).
4. **#554 slice C:** Avg correct via rollup or bounded live compute — PATCH/MINOR per schema.
5. **#553:** Top-picks strip UI behind self Profile first; public after rollup.

---

## Non-goals (Wave 2)

- Pool-only stats overlays (belongs with #555 explorer private mode)
- Paywalled or competitive “compare to friends” without privacy review
- Using weekly catalog `gap` for historical display
