#!/usr/bin/env node
/**
 * One-shot QA harness bootstrap for Cloud Agents and local dev.
 *
 * Automates everything that does not require Firebase Console or Cursor
 * dashboard access. Prints a checklist for manual steps (Google account,
 * Cloud Agent secrets, GitHub Actions secrets).
 *
 * Usage:
 *   node scripts/qa/setup-qa-harness.mjs
 *   npm run qa:setup
 */

import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

function runNpm(script) {
  console.log(`\n[qa:setup] → npm run ${script}`);
  const r = spawnSync('npm', ['run', script], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0) {
    throw new Error(`npm run ${script} exited ${r.status}`);
  }
}

function has(name) {
  const v = process.env[name]?.trim();
  return Boolean(v && !v.startsWith('YOUR_'));
}

function suggestGoogleCredentials() {
  const suffix = randomBytes(3).toString('hex');
  const password = `Qa-${randomBytes(12).toString('base64url')}!9`;
  return {
    email: `setlistpickem.qa.${suffix}@gmail.com`,
    password,
  };
}

async function main() {
  console.log('## QA harness setup\n');

  const injected = (process.env.CLOUD_AGENT_INJECTED_SECRET_NAMES || '')
    .split(',')
    .filter(Boolean);
  if (injected.length) {
    console.log(`Cloud Agent secrets detected: ${injected.join(', ')}`);
  }

  const checklist = [];

  // ── Step 1: materialize .env.qa.local ─────────────────────────────────────
  if (!has('QA_TEST_EMAIL') || !has('QA_TEST_PASSWORD')) {
    console.error(
      '[qa:setup] BLOCKED: QA_TEST_EMAIL and QA_TEST_PASSWORD must be set.',
    );
    console.error('  Cloud Agents: add under Dashboard → Cloud Agents → Secrets.');
    process.exit(1);
  }

  runNpm('qa:materialize-env');
  if (!existsSync(resolve(ROOT, '.env.qa.local'))) {
    throw new Error('.env.qa.local was not created');
  }
  console.log('[qa:setup] ✓ .env.qa.local materialized');

  // ── Step 2: email/password returning-user runner ────────────────────────────
  runNpm('qa:cache');
  console.log('[qa:setup] ✓ qa:cache PASS (email/password returning user)');

  // ── Step 3: Google gating (no OAuth creds required) ───────────────────────
  runNpm('qa:google-signup');
  console.log('[qa:setup] ✓ qa:google-signup gating PASS');

  // ── Step 4: Google OAuth (optional) ───────────────────────────────────────
  if (has('QA_GOOGLE_TEST_EMAIL') && has('QA_GOOGLE_TEST_PASSWORD')) {
    console.log('\n[qa:setup] Google OAuth secrets present — OAuth phase ran in qa:google-signup.');
    checklist.push('After each Google new-user test run, delete the Firebase Auth user + users/{uid} doc (docs/TESTING.md reset protocol).');
  } else {
    const suggested = suggestGoogleCredentials();
    console.log('\n### Manual: Google new-user OAuth (one-time)\n');
    console.log('The existing QA_TEST_* account is email/password only (@road2media.com).');
    console.log('Google OAuth E2E needs a separate Gmail **not** registered in Firebase.\n');
    console.log('1. Create a dedicated Gmail (suggested naming):');
    console.log(`   Email:    ${suggested.email}`);
    console.log(`   Password: ${suggested.password}`);
    console.log('   (Use your own values if preferred; disable 2FA or use App Password for automation.)\n');
    console.log('2. Add secrets in **Cursor → Cloud Agents → Secrets** (this repo):');
    console.log('   QA_GOOGLE_TEST_EMAIL');
    console.log('   QA_GOOGLE_TEST_PASSWORD\n');
    console.log('3. Mirror the same two secrets in **GitHub → Settings → Secrets → Actions** for CI.\n');
    console.log('4. Re-run:  npm run qa:setup\n');
    console.log('5. Optional: register QA_APPCHECK_DEBUG_TOKEN in Firebase Console if you use a custom UUID.');
    checklist.push('Create Gmail + add QA_GOOGLE_TEST_* to Cloud Agent and GitHub Actions secrets.');
  }

  // ── Step 5: remaining optional secrets ────────────────────────────────────
  if (!has('QA_PUBLIC_PROFILE_UID')) {
    console.log('[qa:setup] ✓ QA_PUBLIC_PROFILE_UID auto-resolved (no secret needed on Cloud Agents)');
  }
  if (!has('QA_APPCHECK_DEBUG_TOKEN')) {
    console.log('[qa:setup] ✓ QA_APPCHECK_DEBUG_TOKEN defaulted to registered debug UUID');
  }

  if (checklist.length) {
    console.log('\n### Remaining manual checklist');
    checklist.forEach((item, i) => console.log(`${i + 1}. ${item}`));
  } else {
    console.log('\n[qa:setup] Harness fully configured.');
  }
}

main().catch((err) => {
  console.error('[qa:setup] failed:', err.message || err);
  process.exit(1);
});
