#!/usr/bin/env node
/**
 * QA runner for `.cursor/skills/pr-qa/recipes.md` §B — Firestore read
 * cache verification (issue #251 pilot, #349 auth).
 *
 * What it asserts: navigating away from `/user/<uid>` and back via SPA
 * routing reuses the React Query cache for `useUserSeasonStats`,
 * skipping the Firestore read that initially populated the page.
 *
 * **Auth:** `firestore.rules` require `signedIn()` for `users/{uid}`,
 * `pools`, `show_calendar`, etc. The runner signs in with
 * **`QA_TEST_EMAIL` / `QA_TEST_PASSWORD`** via the splash `/?login=true`
 * modal before SPA-navigating to `/user/:uid`.
 *
 * Failure messages cite recipes.md §B so a failing run is actionable
 * without context-switching.
 */

import { chromium } from 'playwright';

import { signInViaSplashEmailPassword } from './_lib/qaAuthSplash.mjs';
import { enableFirebaseAppCheckDebug } from './_lib/qaBrowserInit.mjs';
import { PUBLIC_PROFILE_UID } from './fixtures.js';
import { startPreview } from './_lib/preview.mjs';

// Baseline must show real Firestore traffic (not a broken / empty session).
// Materialized `users/{uid}` season stats are often **small** WebChannel payloads;
// the old 5 kB floor assumed a live-compute fan-out — too strict for real accounts.
const BASELINE_MIN_BYTES = 512;
// Bytes **saved** on SPA return (baseline − post-nav). Materialized stats + CDP
// counting often land in the mid‑hundreds (e.g. ~500 B); 1 KiB was too strict.
const SAVED_MIN_BYTES = 350;

const BOUNCE_UID = 'qa-cache-bounce-not-a-real-uid';

const NAV_TIMEOUT_MS = 20_000;

const QA_APPCHECK_DEBUG_TOKEN_PLACEHOLDER = 'YOUR_REGISTERED_APPCHECK_DEBUG_UUID';
const QA_TEST_EMAIL_PLACEHOLDER = 'YOUR_QA_TEST_EMAIL';
const QA_TEST_PASSWORD_PLACEHOLDER = 'YOUR_QA_TEST_PASSWORD';

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
 * @param {import('playwright').Page} page
 */
async function waitForNotFound(page) {
  await page.waitForSelector('text=/Player not found/i', {
    timeout: NAV_TIMEOUT_MS,
  });
  await page.waitForLoadState('networkidle');
}

/**
 * @param {number} bytes
 */
function fmtBytes(bytes) {
  return `${bytes}B (${(bytes / 1024).toFixed(1)}kB)`;
}

/**
 * Sum **encoded** bytes for `firestore.googleapis.com` per phase. Playwright's
 * `response.body()` is unreliable for Firestore's streaming WebChannel (often
 * ~100 B); CDP `Network.loadingFinished.encodedDataLength` matches DevTools.
 *
 * @param {import('playwright').CDPSession} session
 * @param {() => 'idle'|'baseline'|'postNav'} getPhase
 * @param {{ baseline: number, postNav: number }} phaseBytes
 */
function attachFirestoreCdpByteCounter(session, getPhase, phaseBytes) {
  /** @type {Map<string, string>} */
  const urlByRequestId = new Map();

  session.on('Network.responseReceived', (e) => {
    urlByRequestId.set(e.requestId, e.response.url);
  });

  session.on('Network.loadingFinished', (e) => {
    const url = urlByRequestId.get(e.requestId);
    urlByRequestId.delete(e.requestId);
    if (!url?.includes('firestore.googleapis.com')) return;
    const phase = getPhase();
    if (phase !== 'baseline' && phase !== 'postNav') return;
    const n = e.encodedDataLength ?? 0;
    phaseBytes[phase] += n;
  });
}

function requireCacheEnv() {
  const appCheckToken = process.env.QA_APPCHECK_DEBUG_TOKEN?.trim();
  if (!appCheckToken || appCheckToken === QA_APPCHECK_DEBUG_TOKEN_PLACEHOLDER) {
    console.error(
      '[qa:cache] QA_APPCHECK_DEBUG_TOKEN is not set (or still the placeholder ' +
        'from `.env.qa.example`). See `scripts/qa/README.md`.',
    );
    process.exit(1);
  }

  const email = process.env.QA_TEST_EMAIL?.trim();
  const password = process.env.QA_TEST_PASSWORD?.trim();
  if (
    !email ||
    !password ||
    email === QA_TEST_EMAIL_PLACEHOLDER ||
    password === QA_TEST_PASSWORD_PLACEHOLDER
  ) {
    console.error(
      '[qa:cache] QA_TEST_EMAIL and QA_TEST_PASSWORD are required (Firebase rules ' +
        'require signed-in reads for profile data). Use a dedicated test account; ' +
        'see `.env.qa.example` and issue #349.',
    );
    process.exit(1);
  }

  return { appCheckToken, email, password };
}

async function run() {
  const { email, password } = requireCacheEnv();

  console.log('[qa:cache] building production artifact + starting vite preview…');
  const preview = await startPreview();
  console.log(`[qa:cache] preview ready at ${preview.url}`);

  const browser = await chromium.launch({ headless: true });
  let exitCode = 1;

  try {
    const ctx = await browser.newContext();
    await enableFirebaseAppCheckDebug(ctx);
    const page = await ctx.newPage();

    let phase = /** @type {'idle'|'baseline'|'postNav'} */ ('idle');
    const phaseBytes = { baseline: 0, postNav: 0 };

    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    attachFirestoreCdpByteCounter(cdp, () => phase, phaseBytes);

    await signInViaSplashEmailPassword(page, preview.url, email, password);

    phase = 'baseline';
    await spaNavigate(page, `/user/${PUBLIC_PROFILE_UID}`);
    await waitForProfileSettled(page);

    if (phaseBytes.baseline < BASELINE_MIN_BYTES) {
      console.error(
        `[qa:cache] FAIL: baseline payload was ${fmtBytes(phaseBytes.baseline)}, ` +
          `expected >= ${fmtBytes(BASELINE_MIN_BYTES)}.`,
      );
      console.error(
        '[qa:cache]   Baseline Firestore bytes are near zero — check App Check, auth, ' +
          'or WebChannel measurement. See scripts/qa/README.md.',
      );
      return;
    }

    phase = 'idle';
    await spaNavigate(page, `/user/${BOUNCE_UID}`);
    await waitForNotFound(page);

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
        `[qa:cache] FAIL: saved ${fmtBytes(saved)} is below ${fmtBytes(SAVED_MIN_BYTES)} ` +
          `(baseline ${fmtBytes(phaseBytes.baseline)}, post-nav ${fmtBytes(phaseBytes.postNav)}). ` +
          'Likely React Query cache miss on season stats, or threshold needs tuning — see recipes §B.',
      );
      console.error(
        '[qa:cache]   See `.cursor/skills/pr-qa/recipes.md` §B for context.',
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
