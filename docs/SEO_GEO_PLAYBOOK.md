# SEO / GEO playbook

**Purpose:** Ops + measurement checklist for epic [#657](https://github.com/pat792/set-picks/issues/657) so organic and generative findability work is observable.  
**Canonical host:** `https://www.setlistpickem.com` (apex `setlistpickem.com` **308 → www**; do not expect apex to index).  
**Related:** Child **G** [#664](https://github.com/pat792/set-picks/issues/664).

---

## 1. Properties & surfaces

| Surface | URL / path | Notes |
|---------|------------|--------|
| Homepage | `https://www.setlistpickem.com/` | Canonical; social scrapers get OG shell via `middleware.js` + `og-home-html.mjs` (**not** Googlebot — see #658) |
| How it works | `/how-it-works` | In `public/sitemap.xml` |
| Scoring | `/how-scoring-works` | In `public/sitemap.xml` |
| About | `/about` | **v1.56.0 (#941):** origin story; in `public/sitemap.xml` |
| Keyword landing | `/phish-setlist-prediction-game` | In `public/sitemap.xml` (#660 / #940) |
| Sitemap | `/sitemap.xml` | Listed in `robots.txt` |
| LLM / agent brief | `/llms.txt` | Static marketing summary + name variants + archive disambiguation (#661). **#930:** Tour Insights definitions (unique / frequency / 30+ bustouts) + summer deep link. |
| SEO config | `src/shared/config/seo.js` | Titles, description, OG image version — sync via `npm run verify:seo-strings` (#663) |
| Helmet + JSON-LD | `src/features/landing/ui/LandingSeo.jsx` | Client source of truth for browsers; homepage FAQ/HowTo also in prerender HTML |
| Public profiles | `/user/:userId` | **`noindex,follow`** (#661) — not sitemap targets |
| Dashboard | `/dashboard/*` | **Private** — `robots.txt` Disallow; never prerender for crawlers |
| Tour Insights | `/tour-stats`, `/tour-stats/:slug` | Firestore `_index` + docs **auto-update** nightly; **SEO URLs are opt-in** (`seoRoutes.js` + sitemap + `llms.txt`). New tours do not auto-prerender (backlog under [#926](https://github.com/pat792/set-picks/issues/926)). Live summer slug: `2026-summer-tour`. |

**Search Console:** Prefer a **Domain** property (`setlistpickem.com`) or the **URL-prefix** property for `https://www.setlistpickem.com/`. When inspecting, always use **www** URLs. Apex showing “Page with redirect” is expected and healthy.

---

## 2. After each SEO deploy — reindex cadence

Run this after Child A / B / H1 / **D** (and any PR that changes public crawl HTML, sitemap, robots, or `llms.txt`):

1. Confirm Vercel **production** is READY on `main`.
2. Smoke with curl (no browser JS required for middleware / static tags):

```bash
# Search bot → SPA shell (favicons + non-empty body). Must NOT be empty <body></body> OG-only.
curl -sA 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' \
  'https://www.setlistpickem.com/' | head -c 2500

# Social scraper → minimal OG shell (empty body OK; favicon links present after #658).
curl -sA 'facebookexternalhit/1.1' 'https://www.setlistpickem.com/' | head -c 1500

npm run verify:og-home
```

3. Search Console → **URL Inspection** → `https://www.setlistpickem.com/` (and each new public route). **Child D (#930) after promote:** also inspect the hub, summer slug, and LLM brief:
   - `https://www.setlistpickem.com/tour-stats`
   - `https://www.setlistpickem.com/tour-stats/2026-summer-tour`
   - `https://www.setlistpickem.com/llms.txt`
4. **Test live URL** → confirm favicons / title / body (or prerendered content once #659 ships).
5. **Request indexing** on each changed URL. **#930 ops AC (human):** request indexing on the three URLs above after `main` is READY.
6. If sitemap changed: Sitemaps → confirm `https://www.setlistpickem.com/sitemap.xml` (re-submit only if GSC shows a durable error; “Temporary processing error” is usually transient).
7. Log the date in §4 weekly table (notes column).

**Do not** request indexing on apex `https://setlistpickem.com/` — it redirects.

### Child A status (2026-07-19)

| Step | Status |
|------|--------|
| #658 shipped (`1.31.1`, tag `v1.31.1`) | Done |
| Googlebot curl → SPA shell | Done |
| www URL indexed in GSC | Done (“URL is on Google”) |
| Request indexing after deploy | Done (2026-07-19) |

GSC live-test console noise (CSP Report-Only, service worker reject, reCAPTCHA storage) is **not** an indexing failure — see `docs/SECURITY_HEADERS.md`.

---

## 3. Baseline query set

Track these weekly in Search Console (Performance → Queries) and spot-check SERPs / AI Overviews.

### Brand / navigational

| ID | Query |
|----|--------|
| B1 | `setlist pick'em` / `setlist pickem` |
| B2 | `setlistpickem` |
| B3 | `setlist pick em phish` |

### Category / intent

| ID | Query |
|----|--------|
| C1 | `phish setlist game` |
| C2 | `setlist prediction game` / `predicting setlists` |
| C3 | `phish pick em` / `phish pick'em` / `setlist picks game` |
| C4 | `live setlist prediction` |
| C5 | `fantasy setlist` / `fantasy setlists` / `phish fantasy setlist` |

**Keyword landing (#660):** `/phish-setlist-prediction-game` — definitional page targeting C1–C5; disambiguates prediction / fantasy setlist game vs setlist archives; jam-band framing with Phish as exemplar.

### Stats-intent (after #665 public `/tour-stats`)

| ID | Query | Target path |
|----|--------|-------------|
| S1 | `phish tour setlist stats` | `/tour-stats` |
| S2 | `phish song frequency [tour year]` (e.g. summer 2026) | `/tour-stats/2026-summer-tour` |
| S3 | `phish bustouts [tour]` | `/tour-stats/2026-summer-tour` |
| S4 | `bustouts summer tour 2026` | `/tour-stats/2026-summer-tour` |
| S5 | `phish bustout list this tour` | `/tour-stats/2026-summer-tour` |
| S6 | `unique songs played this tour` | `/tour-stats/2026-summer-tour` |

Public surface: `/tour-stats` + `/tour-stats/:tourSlug` (kebab-case labels from Phish.net calendar ingest). **Aggregates only** — most played, bustouts, gap highlights; never full night setlists. Default tour: **current** (newest `lastShowDate`). Prerender hub + Sphere + **2026 Summer Tour** (`2026-summer-tour`). Definitions in `/llms.txt` match the public UI: unique = distinct titles this tour; frequency = plays this tour; bustout = 30+ show pre-show gap.

**GEO / LLM brief (#930):** `/llms.txt` restates those three definitions and deep-links the summer slug so agents can cite the live tour page, not only home.

### Profile indexing policy (#661)

| Path | robots | Rationale |
|------|--------|-----------|
| `/user/:userId` | `noindex,follow` | Thin/PII risk; shareable links still work. Revisit only if a richer public player-card content bar ships. |

Do **not** add public profiles to `sitemap.xml`.

Add/remove rows as pages ship; keep IDs stable once used in the log.

---

## 4. Weekly measurement log (8+ weeks)

Fill one row per week (Sunday or Monday). Source: Search Console Performance (28-day or weekly filter) + manual SERP/AI Overview spot-check.

**Query IDs:** [`docs/seo/query-registry.json`](seo/query-registry.json) (Child E0 #931). Weekly JSONL write procedure: [`docs/seo/README.md`](seo/README.md).

**Resume (Child D / #930):** the table below is the **interim** log. Keep filling it until Child **E0** [#931](https://github.com/pat792/set-picks/issues/931) (query registry) + **E1** [#932](https://github.com/pat792/set-picks/issues/932) (GSC API + GA4 organic → weekly packs on [#926](https://github.com/pat792/set-picks/issues/926)) land. After E1, this table becomes a pointer — prefer the Action pack + `crew/output/seo/` snapshot over empty Markdown cells. Until then: GSC → Performance → last 7 days → Totals, plus a spot-check of S4–S6 after summer reindex.

| Week starting | Impressions (site) | Clicks | Top query (non-brand) | Best position (C1–C4) | Favicon on `site:setlistpickem.com`? | AI Overview / generative citation? | Notes |
|---------------|--------------------:|-------:|------------------------|------------------------:|--------------------------------------|------------------------------------|-------|
| 2026-07-19 | 76 | 24 | _TBD_ | 5.7 (site avg) | **No** (globe) | _check_ | GSC Performance **last 3 months** (Web; through ~2026-07-17): CTR 31.6%, avg position 5.7. Child A live; www reindex requested. Tab favicon OK; SERP still generic globe → track #662 (expect 2–4 weeks post-#658; recheck weekly). Prefer last-7-days for later weekly rows. |
| 2026-07-26 | | | | | | | _gap — resume after Child D reindex_ |
| 2026-08-02 | | | | | | | |
| 2026-08-09 | | | | | | | A–C live on `main` (summer slug + crawler facts + fan H2s). |
| 2026-08-16 | | | | | | | |
| 2026-08-23 | | | | | | | |
| 2026-08-30 | | | | | | | **#930 resume week.** After promote: request indexing on hub + `/tour-stats/2026-summer-tour` + `/llms.txt`; fill last-7-days totals here. |
| 2026-09-06 | | | | | | | First full week after Child D reindex (if indexing landed 2026-09-02). |

**How to fill Impressions/Clicks:** GSC → Performance → last 7 days → Totals. Optional: export CSV into a spreadsheet; keep this table as the epic-facing summary. Machine log: append-only `crew/output/seo/weekly-log.jsonl` (gitignored — do not commit snapshots). Procedure: [`docs/seo/README.md`](seo/README.md). Automation is #932.

**Favicon check:** Incognito Google → `site:setlistpickem.com` → note whether result icon appears (Child E #662 if still missing after ~2–4 weeks).

**AI / generative:** Spot-check ChatGPT / Gemini / Perplexity for C1–C2; note citation or “no mention.”

---

## 5. Off-site / backlink checklist

Honest citations beat spam. Prefer communities where the product already has context.

| Channel | Status | Action |
|---------|--------|--------|
| Reddit | Done (prior) | Don’t over-post; reply when relevant |
| Phish Discord / fan Discords | Open | Share after public stats (#665) if rules allow. **#930:** prefer the summer slug (UTM in §6), not only home. |
| Newsletter / email list | Open | Comms squad; UTM per §6 |
| phish.net / Mockingbird | Open | Attribution already in footer; cite when discussing data |
| Fan wikis / PT-adjacent forums | Open | Only with useful, non-spammy pages (how-it-works, scoring, public stats) |
| Personal / tour crew shares | Open | Invite links are product, not SEO — still use UTMs for measurement |

**Out of scope:** Buying links, PBNs, scraped directories.

---

## 6. Optional GA4 UTM conventions (backlink / organic posts)

When posting a public URL off-site:

| Param | Suggested values |
|-------|------------------|
| `utm_source` | `reddit`, `discord`, `newsletter`, `forum`, `manual` |
| `utm_medium` | `social`, `email`, `referral` |
| `utm_campaign` | `seo_geo` or epic-scoped (`seo_657`, **`seo_926`** for tour-stats GEO) |
| `utm_content` | short slug (`how-it-works`, `tour-stats-summer-2026`) |

Example (how-it-works / #657):

`https://www.setlistpickem.com/how-it-works?utm_source=reddit&utm_medium=social&utm_campaign=seo_657&utm_content=how-it-works`

Example (**#930** — share the **summer stats URL**, not only home, after a real bustout night):

`https://www.setlistpickem.com/tour-stats/2026-summer-tour?utm_source=discord&utm_medium=social&utm_campaign=seo_926&utm_content=tour-stats-summer-2026`

(`utm_campaign=seo_geo` is also valid; pick one and keep it consistent for the post.)

**#930 ops AC (human):** log ≥1 UTM’d off-site share in this playbook §5 Status/Action, §9 checklist, **or** a comment on [#926](https://github.com/pat792/set-picks/issues/926) / [#930](https://github.com/pat792/set-picks/issues/930).

Optional future event: `organic_landing` (landing path + campaign) — only if product analytics needs it; not required for #664.

---

## 7. Agent / CI touchpoints

| Check | Command / file |
|-------|----------------|
| OG shell + social UA matrix | `npm run verify:og-home` (`scripts/verify-og-home.mjs`, `og-home-html.mjs`) |
| Prerender (#659) | `npm run verify:seo-prerender` (`scripts/prerender-seo.mjs` after build; registry `src/shared/config/seoRoutes.js`) |
| Automation context | `docs/GITHUB_AUTOMATION_CONTEXT.md` → Public landing SEO |

---

## 8. Ship order reminder (from #657 / #926)

1. ~~#658 Googlebot middleware~~ (shipped 1.31.1)
2. **#664** this playbook + GSC baseline (ops)
3. **#659** + **#665** prerender + public tour stats
4. **#660** / **#661** / **#662** / **#663**
5. **#666** enrichment after H1 is indexed
6. ~~#927 / #928 / #929~~ Children A–C (summer slug, crawler facts, fan H2s)
7. **#930** Child D — llms + this playbook (docs); GSC reindex + UTM share are **human ops after promote** (see §9)
8. **#931 / #932** Child E0/E1 — query registry [`docs/seo/query-registry.json`](seo/query-registry.json) + GSC/GA4 weekly packs (replaces empty §4 cells)

---

## 9. Child D ops checklist (#930)

Docs (llms + this playbook) ship in the product PR. The two remaining acceptance checks are **manual after `main` is READY** — they do not block the docs merge.

| Step | Owner | Status |
|------|--------|--------|
| `public/llms.txt` Tour Insights definitions + summer deep link | Agent | Done (this PR) |
| Playbook §3 S4–S6 + §4 resume pointer to E0/E1 | Agent | Done (this PR) |
| GSC URL Inspection + **Request indexing** on hub, `/tour-stats/2026-summer-tour`, `/llms.txt` | Human | **Open** — after promote |
| ≥1 UTM’d off-site share of the **summer** URL (not only home) after a real bustout night; campaign `seo_geo` or `seo_926`, content `tour-stats-summer-2026` | Human | **Open** — log here or on #926 / #930 |

Do **not** request indexing on apex `https://setlistpickem.com/` or on `/tour-stats/summer-tour-2026` (that path 308s to the live slug).
