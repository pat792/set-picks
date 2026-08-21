# Marketing content drafts

Editable reference copy for public marketing / SEO surfaces (not lifecycle comms).

| Doc | Epic / issues | Status |
|-----|---------------|--------|
| [`pickem-search-plan-2026-08.md`](./pickem-search-plan-2026-08.md) | #972 · #970 · #973 · #974 · #975 · #926 · #657 | **EiC-approved** (2026-08-21) — no execution yet; umbrella epic #972 |
| [`942-content-ia-drafts.md`](./942-content-ia-drafts.md) | [#942](https://github.com/pat792/set-picks/issues/942) — [#937](https://github.com/pat792/set-picks/issues/937), [#940](https://github.com/pat792/set-picks/issues/940), [#941](https://github.com/pat792/set-picks/issues/941) | EiC-approved L0 draft. **#940/#941** v1.56.0; **#937** v1.56.1 |
| [`944-chrome-rule-review.md`](./944-chrome-rule-review.md) | [#944](https://github.com/pat792/set-picks/issues/944) | **APPROVED** — editorial light / product dark; Scoring `surface="light"`; title tokens in `src/shared/ui/marketingEditorialChrome.js` |
| [`tour-stats-above-fold-copy.md`](./tour-stats-above-fold-copy.md) | Tour Insights above-fold tighten | Shipped **v1.61.2** — short lede + filter up; SEO body stays in prerender |

## Chrome rule (short)

- **Editorial / SEO prose** → light main (`how-it-works`, keyword, `about`, marketing Scoring).
- **Product / data** → dark (`tour-stats*`). Do not light-theme Tour stats.
- Dark sticky header/footer over light main is intentional (venue frame).

## Conventions

- **Drafts live here** (or under `crew/output/` for ephemeral pipeline artifacts). Chat-only drafts are not enough.
- Production strings ship in `src/features/landing/ui/*` (+ `seoRoutes.js` / prerender as needed).
- Lifecycle email/push/inbox copy stays under [`content/comms/`](../comms/README.md).
- Leadership Ops: [`docs/LEADERSHIP_CREW.md`](../../docs/LEADERSHIP_CREW.md) — draft artifacts must be written to disk.
