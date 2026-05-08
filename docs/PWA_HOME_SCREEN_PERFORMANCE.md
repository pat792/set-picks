# PWA / home screen launch performance

**Status:** Tracking spike — see GitHub issue (search “PWA precache” or labels `performance`, `PWA`).

## Problem statement

Users who add Setlist Pick ’Em to the **home screen** sometimes see **long perceived load** compared to keeping a **Safari tab** warm. Recent feature growth may increase JS payload and main-thread work; root causes should be measured before optimizing.

## Current architecture (relevant bits)

| Piece | Behavior |
|-------|----------|
| **Shell** | Vite SPA: `index.html` + hashed chunks under `/assets/*`. |
| **Hosting** | Vercel (preview/production); static asset caching is governed by Vercel + headers. |
| **Service worker** | **`public/firebase-messaging-sw.js`** — registered from `registerMessagingServiceWorker()` in `src/shared/lib/firebaseMessaging.js` with **scope `/`** for **FCM web push** only. **No** Workbox-style precache of the app shell was in place when this doc was written. |
| **Cold vs warm** | Home-screen launches often **cold-start** the web app process; less in-memory reuse than a backgrounded tab. |

## Hypotheses (validate with profiling)

1. **Network:** First navigation downloads HTML + many JS chunks (and fonts/CSS).
2. **Execution:** Firebase init, App Check (`firebaseAppCheck.js`), React hydration, and dashboard route chunks compete on the main thread.
3. **No offline shell cache:** Without precaching, repeat opens still depend on network RTT and cache freshness.

## Solution directions (non-exclusive)

### A. Measure first

- **Lighthouse** (mobile, throttled) on production URL: LCP, TBT, TTI.
- **Safari Web Inspector** → Performance: record **cold open** from home screen vs same URL in a tab.
- Compare **first visit** vs **second visit** (HTTP cache effects).

### B. Precache app shell (high leverage for *repeat* opens)

- Evaluate **`vite-plugin-pwa`** (Workbox) or equivalent to precache **`index.html`** + critical hashed assets.
- **Must reconcile with FCM:** only one active registration at **`/`** scope today (messaging SW). Options to spike:
  - **Single composed service worker** that handles Workbox precache **and** Firebase messaging handlers (importScripts / build merge), or
  - **Careful scope separation** (harder with root scope).

### C. Deploy freshness (“auto refresh”)

- **Stale-while-revalidate** for shell assets (if precaching): fast paint, background update.
- **`skipWaiting` + `clientsClaim`** when a new SW activates — pair with in-app **“Update available — Reload”** so users aren’t surprised.
- Optional **remote version ping** (tiny JSON or Firestore flag): if `buildId` mismatches, prompt reload once.

### D. First-load latency

- Audit **lazy routes** and **dynamic imports** so the dashboard critical path doesn’t pull rarely used features eagerly.
- Keep heavy Firebase/App Check off the absolute first paint where possible (already partially deferred in places).

### E. CDN / HTTP caching

- Confirm **long-cache, immutable** behavior for **`/assets/*`** hashed files on Vercel.

## Out of scope / constraints

- **Periodic Background Sync** is **not** reliable on iOS Safari for arbitrary “refresh app” logic — do not depend on it for correctness.
- Avoid adding backends beyond Firebase unless product explicitly requires it.

## Related code

- `src/shared/lib/firebaseMessaging.js` — SW registration
- `public/firebase-messaging-sw.js` — messaging worker
- `vite.config.js` — build / chunks
- `vercel.json` — headers (if present)

## Links

- Internal automation note: agent-authored GitHub issues should start with **`[SKIP-PRD]`** so `.github/workflows/gemini-pm.yml` does not overwrite the body (`docs/GITHUB_AUTOMATION_CONTEXT.md`).
