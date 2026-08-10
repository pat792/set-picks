# Tour stats above-fold copy tighten

**Status:** Implemented in `PublicTourStatsPanel` (v1.61.2)  
**Date:** 2026-08-09  
**Pipeline:** marketing-specialist → editor-in-chief (brand-systems voice check)  
**Surface:** `/tour-stats*` public product/data page (dark chrome)  
**Related:** Content IA [#942](https://github.com/pat792/set-picks/issues/942) (tour-stats owns trends, not game walkthrough); tour-stats SEO [#926](https://github.com/pat792/set-picks/issues/926)

## Problem

The public Tour Insights header stacked three dense paragraphs before the tour filter. On typical viewports the filter sat barely below the fold, so the page’s primary job—browse live tour aggregates—lost to SEO/onboarding prose.

## Editorial brief

| Goal | Guidance |
|------|----------|
| Job of first viewport | H1 + one short lede + tour filter |
| Voice | Fan-to-fan, direct; no corporate “window on…” throat-clearing |
| SEO | Keep keyword density in meta + prerender `seoRoutes.paragraphs`; do not dump crawler essays into the interactive chrome |
| IA | Deep-link how-it-works / keyword / scoring below the data, not above the filter |
| Hub vs slug | Hub keeps current-tour + Sphere archive links as a single compact line; slug pages skip that line |

## Approved UI copy

### Eyebrow / H1

Unchanged: `Tour Insights` · route `h1` from `seoRoutes` / live tour label.

### Lede (all `/tour-stats*`)

> Phish tour setlist statistics: most-played songs, song frequency, bustouts by tour, and gap highlights that help you stay sharp between shows—updated every night the band plays live.

### Hub-only line (after lede, before filter)

> **Current:** [2026 Summer Tour setlist statistics](/tour-stats/2026-summer-tour) · **Archive:** [2026 Sphere](/tour-stats/2026-sphere)

(Labels stay dynamic from the default tour slug when available.)

### Secondary note (below stats, above bottom CTA — not in the hero)

> Tour-wide trends only—not a night-by-night archive. Playing unlocks personal stats. [How it works](/how-it-works) · [Phish setlist prediction game](/phish-setlist-prediction-game)

### Bottom CTA row

Unchanged intent: scoring deep link + “Make picks for this tour”.

## Prerender / meta

`seoRoutes` hub/slug `paragraphs` + meta descriptions stay keyword-rich for the **initial HTML** shell (`injectPrerenderHtml` → `#root` main).

### SEO review (post-ship, 2026-08-09) — EiC / marketing-specialist

**Pipeline gap on first pass:** marketing-specialist + EiC were skimmed; `comms-drafter` was the wrong squad skill (lifecycle templates, not marketing SEO). `docs/SEO_GEO_PLAYBOOK.md` §3 stats-intent (S1–S3) was not checked before implementing.

**Architecture fact that matters:** prerender paragraphs live in `#root`, and React `createRoot` **replaces** that node on mount (`seo-prerender-lib.mjs`). Googlebot-with-JS therefore indexes the **CSR** chrome + `TourStatsView`, not the long prerender essay alone. Leaving `seoRoutes.paragraphs` untouched is necessary but **not sufficient**.

| Still strong after tighten | Weakened / dropped from visible CSR |
|----------------------------|-------------------------------------|
| Title / meta / JSON-LD (Helmet + prerender) | “by tour (summer, fall, Sphere…)” phrasing |
| H1: Phish / tour setlist statistics | Explicit “song frequency” |
| Short lede: most-played, bustouts, gap highlights, nightly refresh | Longer “sharpen picks / high-gap songs due” intent copy |
| Public `TourStatsView` H2s + aggregates (frequency, bustouts, gaps) | Hub prose that restated unique songs + 30+ gap |
| Hub Current → summer + Archive → Sphere internal links | — |
| Below-fold deep links to HIW + keyword page | — |
| `llms.txt` tour-stats lines | — |

**Verdict:** Above-fold UX fix stands. Do **not** restore three dense paragraphs. **Do** restore S1–S3 phrases into the single lede so post-render DOM still matches stats-intent queries.

### Amended lede (applied)

> Phish tour setlist statistics: most-played songs, song frequency, bustouts by tour, and gap highlights that help you stay sharp between shows—updated every night the band plays live.

Keeps S1–S3 phrases + the original “stay sharp” / sharpen-picks intent. Still one sentence; filter stays above the fold. Meta/`seoRoutes.paragraphs` unchanged.

## Implementation checklist

- [x] Draft on disk (`content/marketing/tour-stats-above-fold-copy.md`)
- [x] `PublicTourStatsPanel.jsx` — short hero; filter up; secondary note relocated
- [x] `content/marketing/README.md` index row
- [x] PATCH SemVer + CHANGELOG (`1.61.2`)
- [x] SEO review vs playbook S1–S3 + prerender/`#root` replace behavior
- [x] Apply amended lede (Phish + song frequency + by tour + stay sharp)
- [x] Bustouts section: restore header tooltip (`TILE_DEFS.bustouts.long`); keep public SEO body under H2 (#929)
