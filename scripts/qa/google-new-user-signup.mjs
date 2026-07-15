#!/usr/bin/env node
/**
 * QA runner — Google sign-up for **new** users (issue #251 extension).
 *
 * Two phases:
 *   1. **Gating** (always) — create-account legal checkbox, sign-in vs sign-up
 *      modal entry points. No Google credentials required.
 *   2. **OAuth** (optional) — full Create account → Google → /setup when
 *      QA_GOOGLE_TEST_EMAIL / QA_GOOGLE_TEST_PASSWORD are set.
 *
 * Interpreting failures:
 *   - Gating PASS + OAuth FAIL on popup → infra (#412) or Google bot detection.
 *   - Sign-in modal shows "Create account" after Google → expected for new users
 *     on the Sign in modal (PR #406); not a broken OAuth popup.
 *
 * See scripts/qa/README.md and docs/AUTH_TELEMETRY_RUNBOOK.md.
 */

import { chromium } from 'playwright';

import { clickContinueWithGoogle, completeGoogleSignInPopup } from './_lib/qaGoogleOAuth.mjs';
import { enableFirebaseAppCheckDebug } from './_lib/qaBrowserInit.mjs';
import { startPreview } from './_lib/preview.mjs';

const QA_APPCHECK_PLACEHOLDER = 'YOUR_REGISTERED_APPCHECK_DEBUG_UUID';
const QA_GOOGLE_EMAIL_PLACEHOLDER = 'YOUR_QA_GOOGLE_TEST_EMAIL';
const QA_GOOGLE_PASSWORD_PLACEHOLDER = 'YOUR_QA_GOOGLE_TEST_PASSWORD';

/**
 * @returns {{ email: string, password: string } | null}
 */
function readGoogleCreds() {
  const email = process.env.QA_GOOGLE_TEST_EMAIL?.trim();
  const password = process.env.QA_GOOGLE_TEST_PASSWORD?.trim();
  if (
    !email ||
    !password ||
    email === QA_GOOGLE_EMAIL_PLACEHOLDER ||
    password === QA_GOOGLE_PASSWORD_PLACEHOLDER
  ) {
    return null;
  }
  return { email, password };
}

function requireAppCheckForOAuth() {
  const token = process.env.QA_APPCHECK_DEBUG_TOKEN?.trim();
  if (!token || token === QA_APPCHECK_PLACEHOLDER) {
    console.error(
      '[qa:google-signup] OAuth phase needs QA_APPCHECK_DEBUG_TOKEN (registered debug UUID). ' +
        'See scripts/qa/README.md.',
    );
    process.exit(1);
  }
}

/**
 * @param {import('playwright').Page} page
 * @param {string} origin
 */
async function openCreateAccountModal(page, origin) {
  const base = origin.replace(/\/$/, '');
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.getByRole('button', { name: /^create account$/i }).first().click();
  const dialog = page.getByRole('dialog', { name: /^create account$/i });
  await dialog.waitFor({ state: 'visible', timeout: 30_000 });
  return dialog;
}

/**
 * @param {import('playwright').Page} page
 * @param {string} origin
 */
async function openSignInModal(page, origin) {
  const base = origin.replace(/\/$/, '');
  await page.goto(`${base}/?login=true`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  const dialog = page.getByRole('dialog', { name: /^sign in$/i });
  await dialog.waitFor({ state: 'visible', timeout: 30_000 });
  return dialog;
}

/**
 * @param {import('playwright').Page} page
 * @param {import('playwright').Locator} dialog
 */
async function runGatingPhase(page, origin) {
  console.log('[qa:google-signup] phase 1 — modal gating (no OAuth)…');

  const createDialog = await openCreateAccountModal(page, origin);
  const googleBtn = createDialog.getByRole('button', { name: /continue with google/i });
  if (!(await googleBtn.isDisabled())) {
    throw new Error(
      'Create account: Google button should be disabled before legal checkbox is checked.',
    );
  }

  await createDialog.locator('input[type="checkbox"]').check();
  if (await googleBtn.isDisabled()) {
    throw new Error('Create account: Google button should be enabled after legal checkbox.');
  }

  const signInDialog = await openSignInModal(page, origin);
  const signInGoogle = signInDialog.getByRole('button', { name: /continue with google/i });
  if (await signInGoogle.isDisabled()) {
    throw new Error('Sign in modal: Google button should not require legal checkbox.');
  }

  console.log('[qa:google-signup] phase 1 PASS — gating assertions OK');
}

/**
 * @param {import('playwright').Page} page
 * @param {string} origin
 * @param {{ email: string, password: string }} google
 */
async function runOAuthPhase(page, origin, google) {
  console.log('[qa:google-signup] phase 2 — Create account Google OAuth (new user path)…');

  const dialog = await openCreateAccountModal(page, origin);
  await dialog.locator('input[type="checkbox"]').check();

  const popup = await clickContinueWithGoogle(page, dialog);
  await completeGoogleSignInPopup(popup, google.email, google.password);

  await page.waitForURL(/\/setup/, { timeout: 120_000 });
  await page.waitForSelector('text=/username|handle/i', { timeout: 60_000 });

  console.log('[qa:google-signup] phase 2 PASS — landed on /setup after Google create-account');
}

async function run() {
  const google = readGoogleCreds();

  console.log('[qa:google-signup] building production artifact + starting vite preview…');
  const preview = await startPreview();
  console.log(`[qa:google-signup] preview ready at ${preview.url}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  let exitCode = 1;
  try {
    const ctx = await browser.newContext();
    if (google) {
      requireAppCheckForOAuth();
      await enableFirebaseAppCheckDebug(ctx);
    }
    const page = await ctx.newPage();

    await runGatingPhase(page, preview.url);

    if (!google) {
      console.log(
        '[qa:google-signup] OAuth phase SKIP — set QA_GOOGLE_TEST_EMAIL and ' +
          'QA_GOOGLE_TEST_PASSWORD in .env.qa.local (dedicated Google account not ' +
          'registered in Firebase) to run the full new-user path.',
      );
      exitCode = 0;
    } else {
      await runOAuthPhase(page, preview.url, google);
      exitCode = 0;
    }
  } catch (err) {
    console.error('[qa:google-signup] FAIL:', err?.message || err);
  } finally {
    await Promise.race([
      (async () => {
        await browser.close().catch(() => {});
        await preview.kill();
      })(),
      new Promise((resolve) => setTimeout(resolve, 8_000)),
    ]);
    process.exit(exitCode);
  }
}

run().catch((err) => {
  console.error('[qa:google-signup] runner crashed:', err);
  process.exit(1);
});
