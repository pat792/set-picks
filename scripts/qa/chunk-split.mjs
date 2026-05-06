#!/usr/bin/env node
/**
 * QA runner for `.cursor/skills/pr-qa/recipes.md` §A — chunk-load
 * verification (issue #251 pilot).
 *
 * What it asserts: when SPA-navigating from one route to another, only
 * the destination route's chunk loads — chunks for unrelated routes
 * never appear. This is the runtime complement to `npm run build`'s
 * static graph inspection (recipes.md §A bash one-liner).
 *
 * What it doesn't assert: vendor-chunk shape (vendor-react-query,
 * firebase-core, etc.) or chunk SIZE drift. Those are static signals
 * better caught at build time, not by a Playwright runner.
 *
 * Architecture notes:
 *   - The runner snapshots the cumulative set of loaded chunks at
 *     each phase boundary, and computes the delta = new - previous.
 *     Each scenario asserts the delta contains exactly the expected
 *     route component AND no chunks for other lazy routes.
 *   - The list of `LAZY_ROUTE_COMPONENTS` mirrors `src/app/App.jsx`'s
 *     `lazy()` calls. Keep them in sync; treat App.jsx as the source
 *     of truth and update this list whenever a new top-level lazy
 *     route lands.
 *   - SPA navigation uses pushState + popstate (same as
 *     firestore-cache.mjs). See that file's header for why this
 *     works against react-router-dom v6.
 */

import { chromium } from 'playwright';

import { enableFirebaseAppCheckDebug } from './_lib/qaBrowserInit.mjs';
import { PUBLIC_PROFILE_UID } from './fixtures.js';
import { startPreview } from './_lib/preview.mjs';

// Mirrors `src/app/App.jsx`'s lazy()-imported routes. A chunk for any
// of these appearing on a navigation to a *different* route is a
// cross-route leak — the static-import graph reaches across routes
// and partially defeats route-level code splitting (#240/#242).
const LAZY_ROUTE_COMPONENTS = [
  'PasswordResetCompletePage',
  'PublicProfilePage',
  'PoolInviteMissingCodePage',
  'PoolInvitePage',
  'SetupRoute',
  'DashboardRoute',
];

const NAV_TIMEOUT_MS = 20_000;

/**
 * Extract the "named" component from a Vite chunk URL.
 *
 * Vite's default `output.chunkFileNames` shape is
 * `assets/[name]-[hash].js` where `[name]` is allowed to contain
 * dashes (e.g. `firebase-storage`) and `[hash]` is alphanumeric only.
 * The non-greedy name capture plus a `[A-Za-z0-9_]+` (dash-free) hash
 * pattern lets us correctly parse both `PublicProfilePage-AbCd1234.js`
 * and `firebase-storage-AbCd1234.js`.
 *
 * @param {string} url
 * @returns {string | null}
 */
function chunkNameFromUrl(url) {
  const match = url.match(
    /\/assets\/([A-Za-z0-9_-]+?)-[A-Za-z0-9_]+\.js(?:\?.*)?$/,
  );
  return match ? match[1] : null;
}

/**
 * @param {import('playwright').Page} page
 * @param {string} path
 */
async function spaNavigate(page, path) {
  await page.evaluate((next) => {
    window.history.pushState(null, '', next);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

/**
 * Wait until react-router has rendered for `expectedPath` and the
 * network has gone idle (proxy for "all lazy chunks resolved").
 *
 * @param {import('playwright').Page} page
 * @param {string} expectedPath
 */
async function settleAt(page, expectedPath) {
  await page.waitForFunction(
    (expected) => window.location.pathname === expected,
    expectedPath,
    { timeout: NAV_TIMEOUT_MS },
  );
  await page.waitForLoadState('networkidle');
}

async function run() {
  console.log('[qa:chunks] building production artifact + starting vite preview…');
  const preview = await startPreview();
  console.log(`[qa:chunks] preview ready at ${preview.url}`);

  const browser = await chromium.launch({ headless: true });
  let exitCode = 1;

  try {
    const ctx = await browser.newContext();
    await enableFirebaseAppCheckDebug(ctx);
    const page = await ctx.newPage();

    // Cumulative set of every chunk URL that resolved. We snapshot
    // this at phase boundaries and diff to get per-nav deltas.
    const loadedChunks = new Set();
    page.on('response', (response) => {
      const url = response.url();
      // Limit to chunks served by the local preview — third-party
      // assets (Firebase SDK CDN, GA4, etc.) shouldn't match the
      // /assets/<name>-<hash>.js shape anyway, but the origin filter
      // is cheap insurance.
      if (!url.startsWith(preview.url)) return;
      const name = chunkNameFromUrl(url);
      if (!name) return;
      loadedChunks.add(name);
    });

    // Initial paint: hard-load splash. Anything Vite emits
    // <link rel="modulepreload"> for ends up in `initialChunks` and
    // is correctly excluded from later deltas.
    await page.goto(`${preview.url}/`, { waitUntil: 'networkidle' });
    const initialChunks = new Set(loadedChunks);

    // Scenario 1: / -> /user/<UID> expects PublicProfilePage chunk.
    await spaNavigate(page, `/user/${PUBLIC_PROFILE_UID}`);
    await settleAt(page, `/user/${PUBLIC_PROFILE_UID}`);
    const afterUser = new Set(loadedChunks);
    const userDelta = [...afterUser].filter((c) => !initialChunks.has(c));

    // Scenario 2: /user/<UID> -> /password-reset-complete expects
    // PasswordResetCompletePage chunk. Picked over /join (which
    // <Navigate>'s straight back to /, making the chunk transient and
    // the assertion racy) and /setup (which redirects when not
    // authenticated, same problem).
    await spaNavigate(page, '/password-reset-complete');
    await settleAt(page, '/password-reset-complete');
    const afterReset = new Set(loadedChunks);
    const resetDelta = [...afterReset].filter((c) => !afterUser.has(c));

    const scenarios = [
      {
        from: '/',
        to: '/user/<uid>',
        expected: 'PublicProfilePage',
        delta: userDelta,
      },
      {
        from: '/user/<uid>',
        to: '/password-reset-complete',
        expected: 'PasswordResetCompletePage',
        delta: resetDelta,
      },
    ];

    let allPass = true;
    for (const s of scenarios) {
      const containsExpected = s.delta.includes(s.expected);
      const leakedRoutes = s.delta.filter(
        (c) => LAZY_ROUTE_COMPONENTS.includes(c) && c !== s.expected,
      );
      const deltaStr = s.delta.length === 0 ? '<none>' : s.delta.join(', ');

      if (!containsExpected) {
        console.error(
          `[qa:chunks] FAIL ${s.from} -> ${s.to}: expected chunk ` +
            `'${s.expected}-*.js' did not load on this nav. ` +
            `Delta: [${deltaStr}].`,
        );
        console.error(
          '[qa:chunks]   Either the route component was bundled into ' +
            'the main entry (route splitting broke), or the lazy chunk ' +
            'name no longer matches the component name. See ' +
            '`.cursor/skills/pr-qa/recipes.md` §A.',
        );
        allPass = false;
        continue;
      }

      if (leakedRoutes.length > 0) {
        console.error(
          `[qa:chunks] FAIL ${s.from} -> ${s.to}: route chunks for ` +
            `unrelated pages loaded: [${leakedRoutes.join(', ')}].`,
        );
        console.error(
          '[qa:chunks]   See `.cursor/skills/pr-qa/recipes.md` §A for context.',
        );
        console.error(
          '[qa:chunks]   Common cause: a static import chain reaches ' +
            'across routes. Trace with: ' +
            `\`grep -l '${leakedRoutes[0]}-' dist/assets/*.js\`.`,
        );
        allPass = false;
        continue;
      }

      console.log(
        `[qa:chunks] PASS ${s.from} -> ${s.to}: ` +
          `${s.expected} loaded; no cross-route leakage. ` +
          `Delta: [${deltaStr}].`,
      );
    }

    if (allPass) exitCode = 0;
  } finally {
    await browser.close().catch(() => {});
    await preview.kill();
  }

  process.exit(exitCode);
}

run().catch((err) => {
  console.error('[qa:chunks] runner crashed:', err);
  process.exit(1);
});
