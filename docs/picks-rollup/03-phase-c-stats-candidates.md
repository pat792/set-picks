# Phase C — standings / stats candidates (#687)

**Audience:** product + eng (pre-UI).  
**Surfaces:** (1) pre-show Standings card **summary** → link to full Stats, (2) Stats page deep dive, (3) future **picks helper**.  
**Scope tonight:** stats definitions + data readiness — not layout.

Parent: [#687](https://github.com/pat792/set-picks/issues/687) · Phase B: [02-phase-b-review.md](./02-phase-b-review.md)

---

## Night scope (default)

Unless noted, aggregates are for **`showDate` = selected standings show** (tonight / now-picking), over **submitted** pick docs (`hasNonEmptyPicksObject`).

| Join | Source |
|------|--------|
| Song title | `picks.picks.{s1o…wild}` (case-insensitive key) |
| Live **gap** | Song catalog `gap` (shows since last play) — **pre-show** |
| **Vintage** | Song catalog `debut` → year (`debutYearFromCatalogDebut`) — do **not** use `gap` as vintage |
| Ranked pickers | Tour (or global) standings for the active tour — not show points until graded |

Post-show-only metrics (crowd vs official slot) stay out of the pre-show card; see Phase B.

---

## Your five candidates — scored

### 1) Top picks (songs with more than 1 user)

| | |
|--|--|
| **Definition** | Songs appearing on **≥2** submitted cards tonight (any slot). Rank by card count, then slot fills. |
| **Trust** | **High** — same spine as the rollup; filters out noise of “rare = everyone unique.” |
| **Card summary** | Top 3–5 titles + counts (e.g. `Sample in a Jar · 8`) |
| **Stats page** | Full list with `% of pickers`, optional by-slot breakdown |
| **Picks helper** | “Crowd lean” chips / avoid or lean-into consensus |
| **Report backing** | 07-17: Sample in a Jar 8/15 (53%), Golgi 6/15 — multi-picker songs are the real signal |

**Ship priority: P0** for both card + stats.

---

### 2) Total # of songs picked (consolidated list)

| | |
|--|--|
| **Definition** | Unique song titles across all slots tonight + **count of cards** (and optionally total slot fills). Same aggregation as (1), **including** count=1. |
| **Trust** | **High** |
| **Card summary** | One number: `N unique songs · M pickers` (not the full list) |
| **Stats page** | Consolidated sortable table: Song · Cards · Slots · % |
| **Picks helper** | Secondary; full list is analysis, not helper chrome |

**Clarify naming:** “Total # of songs” = **unique titles**, not 6×pickers. Show both unique + pickers on the card.

**Ship priority: P0** (summary count on card; full table on stats).

---

### 3) Picks with the highest gap (top 10)

| | |
|--|--|
| **Definition** | Among titles picked ≥1 tonight, join catalog **`gap`**, rank top 10 by gap descending. Show title · gap · #pickers. |
| **Trust** | **Medium–High** — catalog freshness matters; title mismatch → drop or “unknown gap.” |
| **Caveats** | Use **live catalog gap**, not `official_setlists.songGaps` (those are frozen for **played** songs). Treat `—` / missing as exclude. |
| **Card summary** | “Spiciest pick: {song} (gap {n})” or top 2 |
| **Stats page** | Top 10 table |
| **Picks helper** | Strong fit: “long-gap songs the room is on” |

**Ship priority: P1** (high delight; needs catalog join + unknown handling).

---

### 4) Aggregate vintage across all picks

| | |
|--|--|
| **Definition (recommended)** | Mean **debut year** across **all filled slots** tonight (slot-weighted). Also report median + % of slots with known debut. |
| **Alt** | Mean across **unique titles** only (down-weights repeats of Sample/Golgi). Document which in UI. |
| **Trust** | **Medium–High** — reuse `profileAverages.debutYearFromCatalogDebut` / catalog `debut`. |
| **Caveats** | Missing debut → exclude from mean, show coverage. Do **not** use gap as vintage ([SONG_CATALOG.md](../SONG_CATALOG.md), profile sprint #554). |
| **Card summary** | `Crowd vintage · ~1995` (or “early ’90s”) |
| **Stats page** | Mean / median / coverage + optional histogram later |
| **Picks helper** | Soft signal (“room is leaning classic / modern”) |

**Ship priority: P1**.

---

### 5) Top ranked pickers’ top picks (by frequency)

| | |
|--|--|
| **Definition** | Take top **K** players on **active tour standings** (default K=5 or 10). Collect their **tonight** pick titles. Aggregate frequency among that subset only. |
| **Trust** | **Medium** — clear story (“what leaders picked”), but small K ⇒ noisy; leaders may not have picked yet. |
| **Caveats** | Define rank source: **tour points** (recommended pre-show), not show score. Exclude users with empty tonight picks from the subset (or show “3/5 locked in”). |
| **Card summary** | “Leaders leaning: {song}” (top 1–2 among K) |
| **Stats page** | Table: song · # of top-K · which slots |
| **Picks helper** | “Follow the leaders” mode — optional, easy to game later |

**Ship priority: P2** (after 1–4; more product copy / empty states).

---

## Additional candidates (from Phase B + rollup)

| ID | Candidate | Pre-show? | Priority | Why |
|----|-----------|-----------|----------|-----|
| A | **Pickers tonight** (submitted count) | Yes | **P0** | Highest-trust series from Phase B; one Stat on the card |
| B | **Consensus strip** (≥25% **or** ≥3 pickers) | Yes | **P1** | Stronger than raw top-1 when N is small; 07-17 Sample 53% |
| C | **By-slot favorites** (s1o…enc) | Stats + helper | **P1** | Feeds picks helper directly; card only shows “hottest slot” |
| D | **Pool vs solo mix** (% pool-affiliated) | Stats only | P3 | Cohort is pool-heavy; interesting internally, low fan value |
| E | **Crowd vs official** (slot hit rate) | **Post-show only** | P2 | 8% hit this window — recap / surprise, not pre-show |
| F | **Unique-song density** (unique / pickers) | Stats | P3 | Proxy for “chalky vs spicy room”; optional later |

---

## Suggested packaging (no UI yet)

### Standings pre-show card — “Crowd pulse” summary

Minimum useful set:

1. **Pickers tonight** (A)  
2. **Top multi-picker songs** (1) — 3 titles  
3. **Unique songs** count (2)  
4. Link: “Full crowd stats →”

Nice-to-have on card once joins are cheap:

5. Spiciest gap line (3)  
6. Crowd vintage (4)

Leaders’ picks (5) only if ≥3 of top-K have locked picks.

### Stats page — full analysis

- Consolidated song table (2) with filters: multi-only / all / by slot  
- Gap top 10 (3)  
- Vintage summary (4)  
- Leaders’ picks (5)  
- Optional: consensus (B), by-slot (C), pickers trend across tour (Phase B series)

### Picks helper (later)

Consume the **same aggregates** (don’t re-query ad hoc):

- Consensus by slot (C)  
- High-gap among picked (3)  
- Multi-picker chalk (1)  
- Optional leaders lean (5)

---

## Data / eng notes

| Concern | Approach |
|---------|----------|
| Read cost | Prefer one `picks where showDate ==` (+ catalog already cached client-side). Avoid N+1 user docs for (5) — batch-get top-K uids only. |
| Materialize later | Optional `picks_night_stats/{showDate}` at lock or on a short TTL — not required for v1 if N stays ~10–30. |
| Title join | Case-insensitive; catalog missing → omit from gap/vintage, still count in (1)(2). |
| Privacy | Aggregates only on card/stats; no handles in multi-picker lists. Leaders’ block may show handles of top-K (already public on standings). |
| Extend report CLI | Add gap top-10 + vintage summary to `picksRollupReport` for offline QA of these candidates. |

---

## Proposed build slices (issues)

| Slice | Delivers | Depends |
|-------|----------|---------|
| **C1** | Night song frequency model (multi + full list + pickers count) | — |
| **C2** | Catalog joins: gap top-10 + aggregate vintage | C1 + catalog |
| **C3** | Leaders’ tonight picks aggregate | C1 + tour standings |
| **C4** | Wire summary → Standings card + Stats route (UI) | C1–C2; design |
| **C5** | Picks helper consumes shared aggregates | C1–C2; helper epic |

---

## Decision ask

Confirm or adjust:

1. Vintage = **slot-weighted mean debut year** (vs unique-title mean)?  
2. Leaders’ K = **5 or 10**, rank = **tour standings**?  
3. Card v1 = **A + (1) + (2) + link** only, with gap/vintage on Stats first?

Once signed off, open C1–C3 as `[SKIP-PRD]` children of #687 (C4/C5 when UI is ready).
