# Field RUM — web-vitals → GA4 (#801)

Production-only Core Web Vitals reporting for cold-open and dashboard surfaces.

## What ships

| Piece | Location |
|-------|----------|
| Library | `web-vitals` (lazy-imported after idle) |
| Emitter | `src/shared/lib/webVitals.js` → `ga4Event('web_vital', …)` |
| Route groups | `src/shared/lib/routeGroup.js` |
| Host gate | Same as GA4 (`www.setlistpickem.com` / `setlistpickem.com` only) |

Metrics: **LCP**, **INP**, **CLS**, **TTFB**, **FCP**.

## Event shape

**Event name:** `web_vital`

| Param | Values / notes |
|-------|----------------|
| `metric_name` | `LCP` \| `INP` \| `CLS` \| `TTFB` \| `FCP` |
| `value` | LCP/INP/TTFB/FCP: ms rounded; CLS: 3 decimals |
| `metric_id` | web-vitals id (keeps CLS updates distinct from GA dedupe) |
| `metric_rating` | `good` \| `needs-improvement` \| `poor` |
| `route_group` | `splash` \| `invite_join` \| `invite_site` \| `dashboard` \| `setup` \| `other` |
| `navigation_type` | `navigate` \| `reload` \| `back_forward` \| `prerender` |

Declared in [`docs/API.md`](API.md) §3.

## GA4 Exploration recipe

1. **Explore → Free form**
2. Rows: `route_group`, `metric_name` (custom dimensions — register once if not present)
3. Values: `value` (custom metric) or Event count
4. Filter: Event name = `web_vital`, `metric_name` = `LCP` (or INP/CLS)
5. Optional: split by Device category / Browser to match the 82% mobile / iOS audience
6. Compare **p75** of `value` by `route_group` after Sprint 12 Wave 1 lands

DebugView: open production with GA DebugView (or Tag Assistant) and hard-reload `/`, `/join/:code`, `/dashboard` — expect one `web_vital` per metric as they settle.

## Non-goals

- Vercel Speed Insights (optional later)
- Emitting on localhost / Vercel preview hosts
- Changing performance budgets (measurement only)
