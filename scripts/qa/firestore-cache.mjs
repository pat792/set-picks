#!/usr/bin/env node
/**
 * QA runner for `.cursor/skills/pr-qa/recipes.md` §B — Firestore read
 * cache verification (issue #251 pilot).
 *
 * What it asserts: navigating away from `/user/<uid>` and back via SPA
 * routing reuses the React Query cache for `useUserSeasonStats`,
 * skipping the Firestore read that initially populated the page.
 *
 * What it doesn't assert: `usePublicProfile` (profile + pools) is NOT
 * yet React Query'd, so it re-fetches on every uid mount. The threshold
 * below is calibrated to allow that traffic while still failing on a
 * full season-stats re-fetch.
 *
 * Architecture notes that justified the pattern:
 *   - We can't navigate via Playwright's `page.goto()` because that's a
 *     hard reload and destroys the QueryClient at the React root (in
 *     `src/main.jsx`). Cache hits require a soft (SPA) nav.
 *   - The PublicProfilePage component owns its own ShowCalendarProvider
 *     instance. Navigating splash → /user/<uid> → splash unmounts and
 *     remounts that provider, which re-subscribes to
 *     `show_calendar/snapshot`. That re-subscription's bytes muddy the
 *     measurement. We sidestep this by bouncing /user/A → /user/<bogus>
 *     → /user/A: react-router v6 keeps the route element mounted when
 *     only `:userId` changes, so ShowCalendarProvider stays alive.
 *   - SPA navigation is triggered via `pushState` + `popstate`. The
 *     `history` package (which react-router-dom v6 uses internally)
 *     subscribes to popstate and re-publishes location updates to
 *     subscribers, so a manual popstate dispatch is enough to make
 *     react-router re-render against the new URL.
 *
 * Failure messages cite recipes.md §B so a failing run is actionable
 * without context-switching.
 */

import { chromium } from 'playwright';

import { enableFirebaseAppCheckDebug } from './_lib/qaBrowserInit.mjs';
import { PUBLIC_PROFILE_UID } from './fixtures.js';
import { startPreview } from './_lib/preview.mjs';

// Why these thresholds (empirical, calibrated against staging data on
// 2026-04-29 staging build):
//
// - BASELINE_MIN_BYTES: an initial /user/<uid> render fans out into
//   show_calendar/snapshot subscription + the user's profile doc + the
//   user's pools query + the season-stats compute (live or
//   materialized). For any UID with picks across multiple shows, the
//   total channel?VER=8 traffic comfortably crosses 5 kB. If the
//   configured UID's baseline is below this, the test data is too
//   sparse to make the cache assertion meaningful — we'd risk a
//   false-pass when the cache is actually broken.
//
// - SAVED_MIN_BYTES: the cache benefit we expect to observe after the
//   bounce. A working cache skips the season-stats Firestore read
//   entirely (cache hit on `[uid, showDatesKey]`); a broken cache
//   re-fetches it. The materialized fast path is single-doc and small
//   (~1-2 kB), but the live fallback can be 10s of kB. 5 kB strikes
//   the balance: tight enough to fail when ALL of season stats is
//   re-fetched, loose enough to absorb the
//   profile/pools-not-yet-cached traffic that's intentionally out of
//   scope for #251.
const BASELINE_MIN_BYTES = 5 * 1024;
const SAVED_MIN_BYTES = 5 * 1024;

// Bogus UID used for the bounce. PublicProfilePage renders 'Player not
// found' for unknown uids, which is enough of a UI signal to wait on
// without firing useUserSeasonStats. The string is deliberately
// non-Firebase-shape so it can never collide with a real account.
const BOUNCE_UID = 'qa-cache-bounce-not-a-real-uid';

const NAV_TIMEOUT_MS = 20_000;

/**
 * SPA-navigate to `path` via pushState + popstate. See file header for
 * why this works against react-router-dom v6.
 *
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
 * Wait for the public profile UI to fully settle (no spinners). The
 * stat cells render a Loader2 with `aria-label="Loading <metric>"`
 * while React Query is in-flight; once they're all gone, the data is
 * either cached or freshly fetched.
 *
 * @param {import('playwright').Page} page
 */
async function waitForProfileSettled(page) {
  await page.waitForSelector('text=/Total points/i', { timeout: NAV_TIMEOUT_MS });
  await page.waitForFunction(
    () => !document.querySelector('[aria-label^="Loading "]'),
    null,
    { timeout: NAV_TIMEOUT_MS },
  );
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for the 'Player not found' UI on the bounce target.
 *
 * @param {import('playwright').Page} page
 */
async function waitForNotFound(page) {
  await page.waitForSelector('text=/Player not found/i', {
    timeout: NAV_TIMEOUT_MS,
  });
  await page.waitForLoadState('networkidle');
}

/**
 * Format a byte count for log lines. Keeps output greppable with a
 * stable shape regardless of magnitude.
 *
 * @param {number} bytes
 */
function fmtBytes(bytes) {
  return `${bytes}B (${(bytes / 1024).toFixed(1)}kB)`;
}

const QA_APPCHECK_DEBUG_TOKEN_PLACEHOLDER = 'YOUR_REGISTERED_APPCHECK_DEBUG_UUID';

async function run() {
  const appCheckToken = process.env.QA_APPCHECK_DEBUG_TOKEN?.trim();
  if (!appCheckToken || appCheckToken === QA_APPCHECK_DEBUG_TOKEN_PLACEHOLDER) {
    console.error(
      '[qa:cache] QA_APPCHECK_DEBUG_TOKEN is not set (or still the placeholder ' +
        'from `.env.qa.example`). Headless Playwright hits App Check–enforced ' +
        'Firestore; use a **registered** debug UUID in `.env.qa.local` — same ' +
        'value as in Firebase Console → App Check → your web app → Manage ' +
        'debug tokens. See `scripts/qa/README.md`.',
    );
    process.exit(1);
  }

  console.log('[qa:cache] building production artifact + starting vite preview…');
  const preview = await startPreview();
  console.log(`[qa:cache] preview ready at ${preview.url}`);

  const browser = await chromium.launch({ headless: true });
  let exitCode = 1;

  try {
    const ctx = await browser.newContext();
    await enableFirebaseAppCheckDebug(ctx);
    const page = await ctx.newPage();

    // Phase-tagged byte counter. The response listener routes each
    // matching response into the active phase's bucket; phases that
    // don't appear in the bucket map are silently dropped (used for
    // navigation steps whose traffic we don't care about).
    let phase = /** @type {'idle'|'baseline'|'postNav'} */ ('idle');
    const phaseBytes = { baseline: 0, postNav: 0 };

    page.on('response', async (response) => {
      const url = response.url();
      if (!url.includes('firestore.googleapis.com')) return;
      if (!url.includes('channel?VER=8')) return;
      if (!(phase in phaseBytes)) return;
      try {
        const body = await response.body();
        phaseBytes[/** @type {'baseline'|'postNav'} */ (phase)] += body.length;
      } catch {
        // Body unavailable (already consumed, request aborted, etc.) —
        // skip rather than throw. The measurement is best-effort.
      }
    });

    // Hard-load splash so the SPA shell mounts. After this, all
    // navigation is soft.
    await page.goto(`${preview.url}/`, { waitUntil: 'networkidle' });

    // Step 1: navigate to /user/<uid> and capture baseline.
    phase = 'baseline';
    await spaNavigate(page, `/user/${PUBLIC_PROFILE_UID}`);
    await waitForProfileSettled(page);

    if (phaseBytes.baseline < BASELINE_MIN_BYTES) {
      console.error(
        `[qa:cache] FAIL: baseline payload was ${fmtBytes(phaseBytes.baseline)}, ` +
          `expected >= ${fmtBytes(BASELINE_MIN_BYTES)}.`,
      );
      console.error(
        '[qa:cache]   The configured QA_PUBLIC_PROFILE_UID does not have ' +
          'enough Firestore-heavy season-stats data for the cache assertion ' +
          'to be meaningful. Pick a UID with graded picks across multiple ' +
          'shows. See scripts/qa/README.md.',
      );
      return;
    }

    // Step 2: bounce to a bogus uid. ShowCalendarProvider stays
    // mounted (same route, only :userId changes), so no calendar
    // resubscribe traffic during the bounce or the return.
    phase = 'idle';
    await spaNavigate(page, `/user/${BOUNCE_UID}`);
    await waitForNotFound(page);

    // Step 3: SPA-nav back to /user/<uid> and capture post-nav.
    phase = 'postNav';
    await spaNavigate(page, `/user/${PUBLIC_PROFILE_UID}`);
    await waitForProfileSettled(page);

    const saved = phaseBytes.baseline - phaseBytes.postNav;
    const verdict = saved >= SAVED_MIN_BYTES ? 'PASS' : 'FAIL';

    console.log(
      `[qa:cache] baseline=${fmtBytes(phaseBytes.baseline)}  ` +
        `post-nav=${fmtBytes(phaseBytes.postNav)}  ` +
        `saved=${fmtBytes(saved)}  ` +
        `threshold=${fmtBytes(SAVED_MIN_BYTES)}  ` +
        verdict,
    );

    if (verdict !== 'PASS') {
      console.error(
        '[qa:cache] FAIL: post-nav re-fetched approximately the same ' +
          'channel?VER=8 payload as baseline. useUserSeasonStats does not ' +
          'appear to be hitting React Query cache on SPA back-navigation.',
      );
      console.error(
        '[qa:cache]   See `.cursor/skills/pr-qa/recipes.md` §B for context.',
      );
      console.error(
        '[qa:cache]   Common cause: queryKey instability across mounts ' +
          '(e.g. a freshly-built array/object in the key derived per render).',
      );
      return;
    }

    exitCode = 0;
  } finally {
    await browser.close().catch(() => {});
    await preview.kill();
  }

  process.exit(exitCode);
}

run().catch((err) => {
  console.error('[qa:cache] runner crashed:', err);
  process.exit(1);
});
