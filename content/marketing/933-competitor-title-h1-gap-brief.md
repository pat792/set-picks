# #933 — Competitor title / H1 SEO gap brief

**Status:** draft  
**Date:** 2026-09-03  
**Epic:** #926  
**Issue:** #933 (Child E2) · **Refs:** #931 registry · #973 keyword copy (shipped) · #975 doorway gate  
**Pipeline:** Market Intelligence Operator → Marketing Specialist → EiC gate → GPM oversight  
**Plan:** `content/marketing/pickem-search-plan-2026-08.md` §4 / §6 W2–W5  
**Scanner:** `python3 -m crew.scripts.seo_title_h1_scan` (allowlist + refuse in `crew/tools/allowlist.py`)

---

## Goal

Compare **title / meta / H1–H2 keyword patterns** on allowlisted peer homepages against our registry (`docs/seo/query-registry.json`) and our live keyword + tour-stats surfaces. Feed copy decisions for #973 (already on staging) and the #975 `/phish-picks` gate. **Do not recommend building `/phish-picks`.**

---

## Allowlist decision (2026-09-03 robots / ToS review)

| Host | Decision | Why |
|------|----------|-----|
| `phishpicks.net` / `www.phishpicks.net` / `phish.jampicks.com` | **Allow homepage GET only** | `robots.txt` `Allow: /`; Disallow `/api/`, `/admin`, `/picks`, `/profile`, `/messages`, `/onboarding`. ToS (`/terms`, 2026-09-03): fan hobby game; no scrape prohibition. Apex **308s** to `phish.jampicks.com` (canonical `Host` in robots). |
| `callingit.live` | **OMIT** | Public `/legal` ToS: “not scrape the data.” Robots would allow `/`; ToS wins. Do not add. |
| `ihoz.com` / `www.ihoz.com` | **OMIT** | HTTPS presents a **self-signed cert**; HTTP `robots.txt` is 404. Robots/ToS cannot be verified. |
| `phantasytour.com` / `www.phantasytour.com` | **OMIT** | `robots.txt` allows `/`, but `/terms-of-use` returned a browser-upgrade interstitial with **no readable ToS**. Unclear legal → omit. |
| `phish.net` | **OMIT** | Not in the 2026-08 plan competitor-title set for this child. Archive encyclopedia we already concede. Cloudflare `Content-Signal` `ai-train=no`. Do not add without a dedicated ToS re-review. |

**Hard refuse (code):** Google/Bing SERP HTML, paywalled forums, PII/account paths, off-allowlist hosts, known robots Disallow paths, >12 URLs / run, <2s between live GETs.

One-time public-homepage observations for omitted hosts (ToS/robots review only — **not** scanner defaults, **not** to be re-fetched):

| Host | Title (review) | H1 (review) |
|------|----------------|-------------|
| callingit.live | `Phish Setlist Predictions: Summer Tour 2026 \| callingit.live` | The algorithm thinks it knows what Phish plays next. |
| www.phantasytour.com | `Jam band concerts, tour dates, setlists, stats, games and discussion - Phantasy Tour` | Follow bands, track your shows & run your stats |

Do **not** treat those rows as an allowlisted corpus. Re-check only if a future PR re-opens ToS.

---

## Our surfaces (shipped — source of truth in repo)

From `src/shared/config/seoRoutes.js` + #973 keyword copy + public tour-stats chrome (#929 H2s).

**Live www (2026-09-03 scan):** production still served the **pre-#973** keyword title `Phish Setlist Prediction Game | Setlist Pick'Em` (no “Lock Your Picks”). #973 / v1.62.2 is on `staging` and not yet on `main`. After promote, expect the #973 title below. Summer slug prerender already exposes H2s **Bustouts** and **Most-played songs**. `/llms.txt` is plain text — the heading extractor correctly returns empty; definitions stay in the file.

| URL | Title | H1 | Visible H2 / lede signals |
|-----|-------|----|---------------------------|
| `/phish-setlist-prediction-game` | Phish Setlist Prediction Game — Lock Your Picks \| Setlist Pick'Em | The free Phish setlist prediction game | What is a setlist prediction game?; What are Phish setlist picks?; Fantasy setlists, without the spreadsheet; How to play. Lede: setlist **picks game**, six slots, live score. |
| `/tour-stats` | Phish Tour Statistics & Insights \| Setlist Pick'Em | Phish tour setlist statistics | Lede: most-played, **song frequency**, **bustouts**, gaps. Public H2s: Unique songs this tour; Song frequency; Bustouts (30+ show gap). Aggregates only. |
| `/tour-stats/2026-summer-tour` | 2026 Summer Tour Statistics \| Setlist Pick'Em | 2026 Summer Tour setlist statistics | Same H2 pattern + unique songs / summer bustouts in prerender lede. |
| `/llms.txt` | (plain text) | — | Unique / frequency / 30+ bustout definitions + summer deep link (#930). |

Registry coverage on **our** keyword + tour-stats headings (token match):

| Cluster | IDs | On-page heading/title fit |
|---------|-----|---------------------------|
| Game defend | C1, C2 | Strong — “setlist prediction game” in title + H1 |
| Bridge | C6, C7 | **#973 shipped** — prediction + lock-your-picks in title; “Phish setlist picks” FAQ H2. Not a tip sheet. |
| Stats | S1, S2, S3, S6, S7 | Strong on `/tour-stats*` — tour setlist statistics, song frequency, unique songs this tour, bustouts |

---

## Allowlisted competitor (Jam Picks / phishpicks.net)

**One document GET** of the public homepage (2026-09-03). Title / H1 / meta only — no `/picks` (robots Disallow), no article body.

| Field | Observed |
|-------|----------|
| Canonical | `https://phish.jampicks.com/` (308 from `phishpicks.net`) |
| Title | `Phish \| Jam Picks` |
| Meta | Ten picks, ranked 10 to 1. Hits score their rank. Picks lock when song one drops. |
| H1 | **The Phish Setlist Prediction Game** |
| H2 | None in the initial HTML (client-rendered sections not extracted) |

### Gap vs our keyword page

- They occupy the **same C1/C6 H1 string** we use (“The Phish Setlist Prediction Game” vs our “The free Phish setlist prediction game”). Differentiation is **not** the H1 noun — it is **mechanic + scoring**: we are six locked slots + live pools; they are ten ranked picks, hit = rank points.
- Title is **brand-short** (`Phish | Jam Picks`). They do **not** put “prediction” or “setlist game” in the title. We already do (#973). Hold that title; do not shorten to mimic them.
- Meta is a **scoring rule**, not a tip-sheet promise. Our meta already says lock picks / score live / compete — keep it.
- Homepage HTML does **not** carry bustout / unique-songs / tour-stats phrases. Stats queries stay on **our** `/tour-stats*` — do not chase their homepage for S-cluster.

### Gap vs `phish picks` (C7)

- The old `phishpicks.net` brand now **308s into Jam Picks**. The title token is “Jam Picks,” not “Phish picks.”
- This **weakens** the case for a `/phish-picks` doorway: the colliding peer has **moved off** the exact C7 brand string in the visible title. #975 stays **gated**. Compete on game + pools + live scoring on the existing keyword URL.

---

## Omitted-host notes (do not automate)

**callingit.live** (ToS scrape ban — one-time `/` + `/legal` review):

- Title is a literal **C6 + tour-year** string: `Phish Setlist Predictions: Summer Tour 2026`.
- Meta names openers, encores, **bustouts**, “beat the algorithm.”
- H1 is voice/brand, not the query. H2s include “Picks are open. Call your shots.”
- **Implication:** they still win the “predictions / call the set” SERP frame in owner notes. Our counter remains **prediction game** on one URL (#973), not a nightly tip sheet and not `/phish-picks`.

**Phantasy Tour** (ToS unread — omit):

- Title is a **directory/encyclopedia** bag (“concerts, tour dates, setlists, stats, games”).
- H2 “Predict what you think they'll play” is game-adjacent but not a Phish-only prediction-game title.
- We concede archive depth. Do not scrape show pages.

**ihoz:** unverifiable. Continue to treat as the encyclopedia SERP peer from owner notes only — no heading corpus.

---

## Recommendations (EiC)

1. **Do not build `/phish-picks`.** #975 gate is not green. C7 stays on `/phish-setlist-prediction-game`. Jam Picks’ title no longer matches the exact “phish picks” brand collision.
2. **Hold #973 strings.** Title (prediction + lock-your-picks) + C1 H1 + picks FAQ H2 are the right bridge. Do not stuff “predictions” / tour year into the keyword title to clone callingit.live.
3. **Hold tour-stats H1/H2s** (unique songs this tour, song frequency, bustouts). That is our S-cluster answer. Aggregates only — never full night setlists.
4. **Optional later (not this PR):** a keyword-page sentence that names Summer Tour 2026 **as a link to** `/tour-stats/2026-summer-tour` (already linked as “Tour stats”). Only if GSC shows C6 impressions without clicks after #973 has had time to index. Not a new route.
5. **Weekly cadence:** run `python3 -m crew.scripts.seo_title_h1_scan` with the E1 pack (#932). Optional post-show micro-sweep of **first-party** `/tour-stats*` + `llms.txt` only. Competitor: homepage GET of allowlisted Jam Picks only.
6. **Do not** add callingit.live, ihoz, or Phantasy Tour without a new ToS/robots PR.

---

## Out of scope

- `/phish-picks` route (#975)
- Google/Bing SERP HTML
- Paid links / PBNs
- Full setlist rip or article-body corpora
- Dashboard IA (`src/app/layout/`, `dashboardPageMeta.js`, `docs/DASHBOARD_IA.md`)
- Version bump / deploy / tag

---

## Implementation map

| Artifact | Path |
|----------|------|
| This brief | `content/marketing/933-competitor-title-h1-gap-brief.md` |
| Allowlist + refuse | `crew/knowledge/allowlists/domains.md`, `crew/tools/allowlist.py` |
| Extractor | `crew/tools/seo_extract.py` |
| Scanner | `crew/scripts/seo_title_h1_scan.py` |
| Ephemeral output | `crew/output/intel/seo-gap-*.md` (gitignored) |
| Registry | `docs/seo/query-registry.json` |

---

## Human after promote

Spot-check SERP for C1 / C6 / C7 (owner notes). Agents cannot verify Google/Bing. Do not claim a Vercel preview “works.”
