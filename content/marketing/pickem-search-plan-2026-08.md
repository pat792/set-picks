# Pick'em Search Plan — authoritative SERP / GEO strategy

**Status:** EiC-approved L0 (2026-08-21) — **no execution yet**  
**Date:** 2026-08-21  
**Epic:** #972  
**Tracking (plan/decisions):** #970  
**Children:** #973 (Phase 1 bridge) · #974 (owned social) · #975 (gated doorway) · reuse #930 / #926 / #931–#934 / #959  
**Source:** Manual SERP spot-checks (owner notes) + `docs/SEO_GEO_PLAYBOOK.md` + prior epics #926 / #657  
**Canonical host:** `https://www.setlistpickem.com`  
**Out of scope:** Buying links, SERP HTML scraping, cloning archive encyclopedias, unlocking `/dashboard/*` for crawlers

### Decisions (2026-08-21)

| # | Decision | Status |
|---|----------|--------|
| 1 | Adopt this plan as SEO/GEO north star | **Approved** |
| 2 | Keyword title includes prediction + picks + game (bridge C6/C7) | **Approved** → #973 |
| 3 | Social as SEO authority: show-week **and** always-on owned social | **Approved** → #974 |
| 4 | `/phish-picks` doorway only if we can overtake competition | **Approved (gated)** → #975 · **no build yet** |

---

## 1. Verdict in one paragraph

We already **own the game-intent lane** (`phish setlist game` → 2nd on SERP + generative citations). We **lose every adjacent high-volume fan phrase** that competitors treat as tip sheets, archives, or Instagram-fed content hubs. The plan is not “rank for everything Phish.” It is: **defend game ownership → bridge prediction/picks queries with differentiated game pages → make tour-stats the answer for stats/bustout *decision* intent → close the off-site authority gap** that phishpicks.net is winning with Instagram + backlinks.

---

## 2. SERP snapshot (2026-08, owner notes)

| Query | Us | Winners | Intent read |
|-------|----|---------|-------------|
| `phish setlist game` | **Win** — gen AI + **2nd on SERP** | — | Category / product = **our home turf** |
| `phish setlist prediction` | Not in top 10 | phishpicks.net, callingit.live | Prediction tips / picks tools — competitors frame as “call the set,” we frame as “game” |
| `phish picks` | Not in top 10 | phishpicks.net (dominant); IG-driven posts → backlinks | Short-tail brand collision with a peer product |
| `phish tour stats` | **7th** | ihoz.com, Phantasy Tour | Stats encyclopedia / tour dashboards |
| `phish bustouts` | Not in top 10 | Reddit threads, live-music blogs, phish.net | News + archive gap lists |

**Strategic implication:** Plumbing from #657 / #926 A–C (keyword page, prerender, summer tour URL, crawlable bustout facts) is necessary but not sufficient. Ranking gaps are now **positioning, query-to-URL fit, and off-site authority** — not “are we indexed?”

---

## 3. Intent map (what we fight for vs concede)

### Own (primary)

| Cluster | Example queries | Primary URL | Why we can win |
|---------|-----------------|-------------|----------------|
| **Game** | `phish setlist game`, `setlist prediction game`, `fantasy setlist game` | `/`, `/phish-setlist-prediction-game`, `/how-it-works` | Already winning; product-market fit |
| **Play tonight** | `phish pick em`, `setlist picks game`, `live setlist prediction` | Keyword + how-it-works | Same product; weaker title/H1 alignment today |

### Bridge (secondary — must not sound like tip sheets)

| Cluster | Example queries | Primary URL | Differentiation |
|---------|-----------------|-------------|-----------------|
| **Prediction** | `phish setlist prediction`, `predict phish setlist` | `/phish-setlist-prediction-game` (+ title/H1 tune) | We are a **scored live game**, not a one-off prediction article |
| **Picks** | `phish picks`, `phish setlist picks` | Keyword page + home; **not** a thin “tonight’s picks” doorway | Compete on **game + pools + live scoring**; never try to out-blog phishpicks.net tip cadence |

### Compete selectively (stats)

| Cluster | Example queries | Primary URL | Differentiation |
|---------|-----------------|-------------|-----------------|
| **Tour stats** | `phish tour stats`, `phish song frequency summer 2026` | `/tour-stats`, `/tour-stats/2026-summer-tour` | Aggregates for **pick decisions**; cite phish.net; do not chase full encyclopedia depth |
| **Bustouts (decision)** | `phish bustouts`, `phish bustouts this tour`, `bustout list summer 2026` | Tour-stats bustouts section + Bustout Boost™ on scoring/keyword pages | Win **“what’s busted this tour so I can pick”**; concede **historical gap lore** to phish.net / Reddit |

### Concede (for now)

- Full setlist archives, show-by-show encyclopedias (phish.net, Phantasy Tour, ihoz).
- Pure news “last night’s bustout” blog posts unless we have a durable public surface (#684 show notes still gated — no thin doorway pages).
- Matching phishpicks.net Instagram volume one-for-one without a measured demand-gen program.

---

## 4. Competitive frames (honest)

| Competitor | What they sell in SERP | Our counter-position |
|------------|------------------------|----------------------|
| **phishpicks.net** | “Phish picks” brand + IG posts → backlinks | Own **Pick'em / game** language; IG/social must ship **product moments** (card lock, Bustout Boost, pool invite) with UTMs — not generic setlist chatter |
| **callingit.live** | Prediction / calling the set | Keyword page must say “prediction **game**” in title/H1/first 100 words and prove live scoring |
| **ihoz.com / Phantasy Tour** | Tour dashboards & deep stats | Tour-stats: frequency + bustouts + gaps, refreshed nightly, crawlable HTML (#928 shipped) — depth for **pickers**, not archivists |
| **phish.net / Reddit** | Canonical setlists & discussion | Attribute + link out; never compete on completeness; harvest **decision** queries only |

---

## 5. North-star outcomes (measurable)

Track in GSC + manual SERP/AI spot-checks (playbook §4 + upcoming #931 registry).

| Horizon | Outcome |
|---------|---------|
| **Defend** | Hold top-3 for `phish setlist game`; keep generative citation |
| **Bridge (8–12 weeks)** | Appear top-10 for `phish setlist prediction` and at least one `phish pick'em` / `phish picks` variant |
| **Stats (8–12 weeks)** | Move `phish tour stats` from ~7th → top-5; earn impressions on ≥1 bustout query pointing at `/tour-stats/*` |
| **Authority** | Measurable referral/organic lift from IG/social UTMs (`utm_campaign=seo_geo`); ≥3 honest citations (Reddit reply, Discord, newsletter) — no PBNs |

---

## 6. Workstreams (the game plan)

### W1 — Defend the win (game cluster)

**Owner:** Marketing + Brand Systems (copy) · Engineering only if meta/JSON-LD drift  
**Actions:**

1. Keep `/phish-setlist-prediction-game` as the **definitional** URL; do not fragment into multiple thin landings.
2. Internal-link graph: home Game Format → keyword → how-it-works → scoring → tour-stats (already in #942 IA — enforce in any new copy).
3. GEO: keep `/llms.txt` + FAQ/HowTo JSON-LD aligned with “setlist **game**” language so generative answers keep citing us.
4. Weekly SERP + AI Overview spot-check for C1 (`phish setlist game`) — alert if we drop out of top 5.

### W2 — Bridge prediction + picks (title/H1/entity fit)

**Owner:** Marketing → EiC → implementation PR  
**Problem:** Query says “prediction” / “picks”; our strongest indexed signal says “game.” Competitors match the query string more literally.

**Actions:**

1. **Title / H1 audit** on `/phish-setlist-prediction-game` and home:
   - Keep brand + “game.”
   - Ensure “prediction” and “picks” appear in title *or* H1 *or* first paragraph (not stuffed in all three).
   - Proposed title pattern (draft): `Phish Setlist Prediction Game & Picks | Setlist Pick'Em` — EiC must approve; avoid looking like phishpicks.net.
2. Add FAQ entities: “What are Phish setlist picks?” → answer = lock six slots in our game (not tip lists).
3. **Do not** ship a separate `/phish-picks` doorway until #975 gate is green (overtake evidence). Default: strengthen the existing keyword URL (#973).
4. Feed title/H1 gap findings into #933 (competitor gap briefs).

### W3 — Stats + bustouts (selective authority)

**Owner:** Engineering (#926 remainders) + Marketing copy  
**Already shipped:** Summer tour SEO URL (#927), crawlable bustout/frequency facts (#928), fan-language H2s (#929).

**Actions:**

1. **GSC:** Confirm `https://www.setlistpickem.com/tour-stats/2026-summer-tour` indexed; request indexing if not (playbook §2).
2. **Query → H2 alignment:** Ensure visible H2/copy includes natural phrases `tour stats`, `bustouts`, `song frequency` (Child C intent — verify live HTML still matches).
3. **Bustout Boost™ bridge:** Keyword + scoring pages must explicitly connect “bustouts” search intent → tour-stats list → in-game Bustout Boost scoring (unique angle Reddit/phish.net cannot claim).
4. Optional later: dedicated `/phish-bustouts` **only** if it is a thin redirect/alias into tour-stats with unique lede — prefer one strong URL over doorway sprawl. Default: **no new route** until E0 registry + 4 weeks of GSC data say otherwise.
5. Auto-expand SEO for future tours: #959.

### W4 — Off-site authority (close the Instagram / backlink gap)

**Owner:** Social Demand Gen (L2 queue) + Marketing · **Issue:** #974  
**Problem:** phishpicks.net wins `phish picks` partly via **IG volume → indexed posts → referring domains**. We have product share surfaces but no sustained SEO-aware social cadence.

**Actions:**

1. **Cadence brief** (draft → EiC): **show weeks** (2–4 posts / week) **and always-on** off-week product/authority posts:
   - Pre-show: “card is open” + link to app (not a tip sheet of songs).
   - Mid/post: Bustout Boost hits, pool leaderboard moments, tour-stats “most played this tour.”
   - Off-week: how-to / Bustout Boost education, evergreen tour-stats highlights, soft brand/`/about` beats.
2. Every public URL uses playbook §6 UTMs (`utm_campaign=seo_geo`).
3. Reddit/Discord: reply-only when useful; link tour-stats or how-it-works — never spam.
4. Pursue 1–2 **honest** directory/newsletter mentions (jam-band tools lists) after EiC approval — still no paid links.
5. Track referring domains in GSC Links monthly; goal is trend, not vanity DR.
6. **Human:** create owned IG (Business/Creator) + optional X/Threads before first publish.

### W5 — Measurement loop (stop flying blind)

**Owner:** CDO / Reporting + GPM Optimize  
**Wire to open children:**

| Child | Role in this plan |
|-------|-------------------|
| #931 E0 | Commit query registry including the five snapshot queries + IDs below |
| #932 E1 | Weekly GSC/GA4 packs on #926 |
| #933 E2 | Allowlisted competitor title/H1 scans (phishpicks.net, callingit.live, ihoz, PT) |
| #934 E3 | Draft-only SEO Optimize autonomy |

Fill playbook §4 weekly rows; empty tables are a process failure, not a content failure.

---

## 7. Expanded query registry (seed for #931)

Stable IDs — keep forever once logged.

### Brand

| ID | Query | Target |
|----|--------|--------|
| B1 | `setlist pick'em` / `setlist pickem` | `/` |
| B2 | `setlistpickem` | `/` |
| B3 | `setlist pick em phish` | `/` |

### Game (defend)

| ID | Query | Target | Priority |
|----|--------|--------|----------|
| C1 | `phish setlist game` | `/phish-setlist-prediction-game` | P0 |
| C2 | `setlist prediction game` | `/phish-setlist-prediction-game` | P0 |
| C3 | `phish pick em` / `phish pick'em` | keyword + `/` | P1 |
| C4 | `live setlist prediction` | keyword | P2 |
| C5 | `fantasy setlist` / `phish fantasy setlist` | keyword | P2 |
| C6 | `phish setlist prediction` | keyword | **P0 bridge** |
| C7 | `phish picks` / `phish setlist picks` | keyword + `/` | **P0 bridge** |

### Stats (compete)

| ID | Query | Target | Priority |
|----|--------|--------|----------|
| S1 | `phish tour stats` / `phish tour setlist stats` | `/tour-stats`, summer slug | P0 |
| S2 | `phish song frequency` + tour year | summer slug | P1 |
| S3 | `phish bustouts` / `phish bustouts this tour` | summer slug bustouts | **P0** |
| S4 | `phish unique songs` / `songs played this tour` | summer slug | P2 |

---

## 8. Ship order (recommended)

| Phase | Focus | Issue | Depends on | Artifact |
|-------|--------|-------|------------|----------|
| **0 — Now** | Plan + decisions; epic graph | #972 / #970 | — | This doc (**done**) |
| **1 — Meta bridge** | Title/H1/FAQ for C6/C7 | #973 | Kickoff | Copy PR → `staging` |
| **2 — Index & verify** | GSC summer tour-stats; bustout HTML | #930 (reuse) | #927–#929 live | Playbook §2 |
| **3 — Social authority** | Owned IG/X + show-week **and** always-on packs | #974 | Accounts + EiC | `crew/output/demand_gen/` |
| **4 — Optimize engine** | Registry + weekly packs + competitor briefs | #931–#934 under #926 | — | Packs on #926 |
| **5 — Gated doorway** | `/phish-picks` only if overtake evidence | #975 | Gate checklist | **No build until green** |
| **6 — Auto tours** | Future tour SEO expand | #959 under #926 | Gate on aggregates | Prerender/sitemap |

---

## 9. Explicit non-goals

- Outranking phish.net for archival setlist queries.
- Publishing nightly “predicted setlist” blog posts to chase `phish picks`.
- Doorway pages for every keyword variant (single gated doorway max — #975).
- Scraping Google SERPs or competitor full content.
- Making private game surfaces crawlable.
- Agents creating network accounts (human prerequisite for #974).

---

## 10. RACI

| Work | A | R | C |
|------|---|---|---|
| Plan approve | EiC | Marketing Specialist | CCO, Brand Systems, GPM |
| On-page copy/meta (#973) | EiC | Marketing → eng PR | Brand Systems |
| Tour-stats SEO remainders (#926) | GPM / CTO | Engineering | Marketing |
| Social / IG cadence (#974) | EiC (L2) | Social Demand Gen | Marketing, Brand Systems |
| Weekly measurement (#931–#934) | GPM | Reporting / #932 | CDO, Marketing |
| Doorway gate (#975) | EiC + CCO | Marketing + eng (when green) | GPM |

---

## 11. Next human decisions

**Resolved 2026-08-21** — see Decisions table at top. Remaining before execution:

1. Create owned IG (+ optional X/Threads) accounts.
2. Explicit **kickoff** per child (#973 / #974 / #930) — no silent starts.
3. Keep #975 blocked until gate evidence.

---

## Related docs

- Ops checklist: [`docs/SEO_GEO_PLAYBOOK.md`](../../docs/SEO_GEO_PLAYBOOK.md)
- Content IA: [`content/marketing/942-content-ia-drafts.md`](./942-content-ia-drafts.md)
- Epic: #972 · Stats/Optimize: #926 · Foundation: #657
