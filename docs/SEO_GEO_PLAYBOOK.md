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
| Sitemap | `/sitemap.xml` | Listed in `robots.txt` |
| LLM / agent brief | `/llms.txt` | Static marketing summary |
| SEO config | `src/shared/config/seo.js` | Titles, description, OG image version |
| Helmet + JSON-LD | `src/features/landing/ui/LandingSeo.jsx` | Client source of truth for browsers |
| Dashboard | `/dashboard/*` | **Private** — `robots.txt` Disallow; never prerender for crawlers |

**Search Console:** Prefer a **Domain** property (`setlistpickem.com`) or the **URL-prefix** property for `https://www.setlistpickem.com/`. When inspecting, always use **www** URLs. Apex showing “Page with redirect” is expected and healthy.

---

## 2. After each SEO deploy — reindex cadence

Run this after Child A / B / H1 (and any PR that changes public crawl HTML, sitemap, or robots):

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

3. Search Console → **URL Inspection** → `https://www.setlistpickem.com/` (and each new public route).
4. **Test live URL** → confirm favicons / title / body (or prerendered content once #659 ships).
5. **Request indexing** on each changed URL.
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
| C2 | `setlist prediction game` |
| C3 | `phish pick em` / `phish pick'em` |
| C4 | `live setlist prediction` |

**Keyword landing (#660):** `/phish-setlist-prediction-game` — definitional page targeting C1–C3; disambiguates prediction game vs setlist archives.

### Stats-intent (after #665 public `/tour-stats`)

| ID | Query |
|----|--------|
| S1 | `phish tour setlist stats` |
| S2 | `phish song frequency [tour year]` (e.g. summer 2026) |
| S3 | `phish bustouts [tour]` |

Public surface: `/tour-stats` + `/tour-stats/:tourSlug` (kebab-case labels from Phish.net calendar ingest). **Aggregates only** — most played, bustouts, gap highlights; never full night setlists. Default tour: **current** (newest `lastShowDate`). Prerender hub + Sphere shell; other tours hydrate client-side from `public_tour_stats`.

Add/remove rows as pages ship; keep IDs stable once used in the log.

---

## 4. Weekly measurement log (8+ weeks)

Fill one row per week (Sunday or Monday). Source: Search Console Performance (28-day or weekly filter) + manual SERP/AI Overview spot-check.

| Week starting | Impressions (site) | Clicks | Top query (non-brand) | Best position (C1–C4) | Favicon on `site:setlistpickem.com`? | AI Overview / generative citation? | Notes |
|---------------|--------------------:|-------:|------------------------|------------------------:|--------------------------------------|------------------------------------|-------|
| 2026-07-19 | 76 | 24 | _TBD_ | 5.7 (site avg) | **No** (globe) | _check_ | GSC Performance **last 3 months** (Web; through ~2026-07-17): CTR 31.6%, avg position 5.7. Child A live; www reindex requested. Tab favicon OK; SERP still generic globe → track #662 (expect 2–4 weeks post-#658; recheck weekly). Prefer last-7-days for later weekly rows. |
| 2026-07-26 | | | | | | | |
| 2026-08-02 | | | | | | | |
| 2026-08-09 | | | | | | | |
| 2026-08-16 | | | | | | | |
| 2026-08-23 | | | | | | | |
| 2026-08-30 | | | | | | | |
| 2026-09-06 | | | | | | | |

**How to fill Impressions/Clicks:** GSC → Performance → last 7 days → Totals. Optional: export CSV into a spreadsheet; keep this table as the epic-facing summary.

**Favicon check:** Incognito Google → `site:setlistpickem.com` → note whether result icon appears (Child E #662 if still missing after ~2–4 weeks).

**AI / generative:** Spot-check ChatGPT / Gemini / Perplexity for C1–C2; note citation or “no mention.”

---

## 5. Off-site / backlink checklist

Honest citations beat spam. Prefer communities where the product already has context.

| Channel | Status | Action |
|---------|--------|--------|
| Reddit | Done (prior) | Don’t over-post; reply when relevant |
| Phish Discord / fan Discords | Open | Share after public stats (#665) if rules allow |
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
| `utm_campaign` | `seo_geo` or epic-scoped (`seo_657`) |
| `utm_content` | short slug (`how-it-works`, `tour-stats-summer-2026`) |

Example:

`https://www.setlistpickem.com/how-it-works?utm_source=reddit&utm_medium=social&utm_campaign=seo_657&utm_content=how-it-works`

Optional future event: `organic_landing` (landing path + campaign) — only if product analytics needs it; not required for #664.

---

## 7. Agent / CI touchpoints

| Check | Command / file |
|-------|----------------|
| OG shell + social UA matrix | `npm run verify:og-home` (`scripts/verify-og-home.mjs`, `og-home-html.mjs`) |
| Prerender (#659) | `npm run verify:seo-prerender` (`scripts/prerender-seo.mjs` after build; registry `src/shared/config/seoRoutes.js`) |
| Automation context | `docs/GITHUB_AUTOMATION_CONTEXT.md` → Public landing SEO |

---

## 8. Ship order reminder (from #657)

1. ~~#658 Googlebot middleware~~ (shipped 1.31.1)
2. **#664** this playbook + GSC baseline (ops)
3. **#659** + **#665** prerender + public tour stats
4. **#660** / **#661** / **#662** / **#663**
5. **#666** enrichment after H1 is indexed
