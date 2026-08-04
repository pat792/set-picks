#!/usr/bin/env node
/**
 * QA runner for `.cursor/skills/pr-qa/recipes.md` §B — Firestore read
 * cache verification (issue #251 pilot, #349 auth).
 *
 * What it asserts: navigating away from `/user/<uid>` (to `/how-it-works`)
 * and back via SPA routing reuses the React Query cache for
 * `useUserSeasonStats`, skipping the Firestore read that initially
 * populated the page.
 *
 * **Auth:** `firestore.rules` require `signedIn()` for `users/{uid}`,
 * `pools`, `show_calendar`, etc. The runner signs in with
 * **`QA_TEST_EMAIL` / `QA_TEST_PASSWORD`** via the `/login` auth entry
 * modal before SPA-navigating to `/user/:uid`.
 *
 * **Pass criterion (#748):** the old assertion compared CDP
 * `encodedDataLength` byte totals per phase, but WebChannel byte deltas
 * sit in a ±2 kB noise floor with off-season data volume — four
 * consecutive staging runs measured `saved` between -2 kB and +168 B.
 * The deterministic replacement inspects Firestore **forward-channel POST
 * bodies**: the season-stats pipeline reads `users/{uid}` (materialized,
 * #244) or `picks/{date}_{uid}` (live fallback), and those document paths
 * appear verbatim in the `addTarget` messages the SDK POSTs. First visit
 * MUST reference the profile's paths; a warm React Query cache return
 * must reference them strictly fewer times. Data-volume independent.
 * Byte totals are still logged, informationally.
 *
 * Failure messages cite recipes.md §B so a failing run is actionable
 * without context-switching.
 */

import { chromium } from 'playwright';

import { signInViaSplashEmailPassword } from './_lib/qaAuthSplash.mjs';
import { enableFirebaseAppCheckDebug } from './_lib/qaBrowserInit.mjs';
import { PUBLIC_PROFILE_UID } from './fixtures.js';
import { startPreview } from './_lib/preview.mjs';

/** Soft-nav away target — marketing route (no Firestore season-stats hook). */
const BOUNCE_PATH = '/how-it-works';

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
  // Do not wait for `networkidle` — signed-in Firestore WebChannel never idles.
  await page.waitForSelector('text=/Total points/i', { timeout: NAV_TIMEOUT_MS });
  await page.waitForFunction(
    () => !document.querySelector('[aria-label^="Loading "]'),
    null,
    { timeout: NAV_TIMEOUT_MS },
  );
  // Brief settle so CDP `loadingFinished` events for the profile read land
  // before we flip measurement phase — without waiting for full network idle.
  await page.waitForTimeout(750);
}

/**
 * @param {import('playwright').Page} page
 */
async function waitForBounceSettled(page) {
  await page.waitForSelector('text=/How it works/i', {
    timeout: NAV_TIMEOUT_MS,
  });
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
 * Informational only as of #748 — byte deltas on the multiplexed WebChannel
 * are inside the noise floor with off-season data, so the PASS/FAIL verdict
 * comes from `attachFirestoreMarkerCounter` instead.
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

/**
 * Count references to the profile's season-stats document paths inside
 * Firestore **forward-channel POST bodies**, per phase (#748).
 *
 * `computeUserSeasonStats` reads `users/{uid}` (materialized #244 path)
 * and/or `picks/{showDate}_{uid}` (live fallback). The SDK's `addTarget`
 * messages carry those full document paths in the URL-encoded WebChannel
 * POST body, so counting path occurrences per phase is independent of
 * payload size, data volume, and ambient listener chatter:
 *
 *   - baseline (first `/user/:uid` visit) MUST reference them ≥ 1 time;
 *   - postNav (SPA return, warm React Query cache) must reference them
 *     STRICTLY FEWER times — the cached query never re-issues its reads.
 *
 * @param {import('playwright').CDPSession} session
 * @param {() => 'idle'|'baseline'|'postNav'} getPhase
 * @param {{ baseline: number, postNav: number }} phaseMarkerHits
 * @param {string} profileUid
 */
function attachFirestoreMarkerCounter(
  session,
  getPhase,
  phaseMarkerHits,
  profileUid,
) {
  const markerRe = new RegExp(
    `documents/(?:users/${profileUid}(?=["'\\\\/,}]|$)|picks/[0-9]{4}-[0-9]{2}-[0-9]{2}_${profileUid}(?=["'\\\\/,}]|$))`,
    'g',
  );

  session.on('Network.requestWillBeSent', (e) => {
    if (!e.request?.url?.includes('firestore.googleapis.com')) return;
    if (e.request.method !== 'POST') return;
    const phase = getPhase();
    if (phase !== 'baseline' && phase !== 'postNav') return;
    const raw = e.request.postData;
    if (!raw) return;
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      // Malformed escape in a body we don't care about — scan it raw.
    }
    const hits = decoded.match(markerRe);
    if (hits) phaseMarkerHits[phase] += hits.length;
  });
}

function requireCacheEnv() {
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

/**
 * @returns {Promise<number>} process exit code
 */
async function run() {
  const { email, password } = requireCacheEnv();

  console.log('[qa:cache] building production artifact + starting vite preview…');
  const preview = await startPreview();
  console.log(`[qa:cache] preview ready at ${preview.url}`);

  const browser = await chromium.launch({ headless: true });

  try {
    const ctx = await browser.newContext();
    await enableFirebaseAppCheckDebug(ctx);
    const page = await ctx.newPage();

    let phase = /** @type {'idle'|'baseline'|'postNav'} */ ('idle');
    const phaseBytes = { baseline: 0, postNav: 0 };
    const phaseMarkerHits = { baseline: 0, postNav: 0 };

    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    attachFirestoreCdpByteCounter(cdp, () => phase, phaseBytes);
    attachFirestoreMarkerCounter(
      cdp,
      () => phase,
      phaseMarkerHits,
      PUBLIC_PROFILE_UID,
    );

    await signInViaSplashEmailPassword(page, preview.url, email, password);

    phase = 'baseline';
    await spaNavigate(page, `/user/${PUBLIC_PROFILE_UID}`);
    await waitForProfileSettled(page);

    if (phaseMarkerHits.baseline < 1) {
      console.error(
        '[qa:cache] FAIL: baseline visit issued ZERO Firestore requests referencing ' +
          `users/${PUBLIC_PROFILE_UID} or picks/*_${PUBLIC_PROFILE_UID}.`,
      );
      console.error(
        '[qa:cache]   The season-stats read was not observed — check App Check, auth, ' +
          'QA_PUBLIC_PROFILE_UID, or WebChannel measurement. See scripts/qa/README.md.',
      );
      return 1;
    }

    phase = 'idle';
    await spaNavigate(page, BOUNCE_PATH);
    await waitForBounceSettled(page);

    phase = 'postNav';
    await spaNavigate(page, `/user/${PUBLIC_PROFILE_UID}`);
    await waitForProfileSettled(page);

    const verdict =
      phaseMarkerHits.postNav < phaseMarkerHits.baseline ? 'PASS' : 'FAIL';
    const savedBytes = phaseBytes.baseline - phaseBytes.postNav;

    console.log(
      `[qa:cache] stats-doc refs: baseline=${phaseMarkerHits.baseline}  ` +
        `post-nav=${phaseMarkerHits.postNav}  ${verdict}`,
    );
    console.log(
      `[qa:cache] bytes (informational): baseline=${fmtBytes(phaseBytes.baseline)}  ` +
        `post-nav=${fmtBytes(phaseBytes.postNav)}  saved=${fmtBytes(savedBytes)}`,
    );

    if (verdict !== 'PASS') {
      console.error(
        `[qa:cache] FAIL: SPA return re-referenced the profile's stats docs ` +
          `${phaseMarkerHits.postNav}x (baseline ${phaseMarkerHits.baseline}x) — ` +
          'the React Query cache did not absorb the season-stats read. See recipes §B.',
      );
      console.error(
        '[qa:cache]   See `.cursor/skills/pr-qa/recipes.md` §B for context.',
      );
      return 1;
    }

    return 0;
  } finally {
    await browser.close().catch(() => {});
    await preview.kill();
  }
}

// Always exit explicitly (#748): a leaked child/pipe handle must never keep
// the event loop — and a CI runner — alive after the verdict is known.
run().then(
  (code) => process.exit(code),
  (err) => {
    console.error('[qa:cache] runner crashed:', err);
    process.exit(1);
  },
);
