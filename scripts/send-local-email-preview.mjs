#!/usr/bin/env node
/**
 * Render email HTML from **local** sources and optionally send via Resend.
 *
 * Usage:
 *   node scripts/send-local-email-preview.mjs                    # render only (opens HTML)
 *   node scripts/send-local-email-preview.mjs --send pat@you.com # render + send (needs RESEND_API_KEY)
 *   node scripts/send-local-email-preview.mjs --service          # service branded shell sample
 *
 * RESEND_API_KEY: export in shell or add to .env (this script loads .env).
 * Inbox sender badge (Gmail list avatar) is NOT controlled by HTML — see docs/comms-triggers/EMAIL_INBOX_BADGE.md.
 */

import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const require = createRequire(import.meta.url);

// Load .env (gitignored) without overwriting existing env.
const envPath = resolve(root, '.env');
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = m[2].trim().replace(/^"|"$/g, '');
    }
  }
} catch {
  // optional
}

const args = process.argv.slice(2);
const sendTo = args.includes('--send') ? args[args.indexOf('--send') + 1] : null;
const serviceOnly = args.includes('--service');

const outDir = resolve(root, 'emails/preview');
mkdirSync(outDir, { recursive: true });

const siteUrl = 'https://www.setlistpickem.com';

/** @type {{ label: string, file: string, subject: string, html: string, text: string }[]} */
const variants = [];

if (!serviceOnly) {
  execSync('npm run build', { cwd: resolve(root, 'emails'), stdio: 'inherit' });
  const bundlePath = resolve(root, 'functions/emails/renderSummerTour2026Launch.cjs');
  delete require.cache[require.resolve(bundlePath)];
  const { renderSummerTour2026LaunchEmail } = require(bundlePath);
  const { html, text, subject } = await renderSummerTour2026LaunchEmail({
    greetingName: 'Pat',
    audienceSegment: 'sphere_alum',
    openerLabel: 'Tuesday, July 7',
    inviteCode: 'DEMO1',
    siteUrl,
    settingsUrl: `${siteUrl}/dashboard/profile/notifications`,
  });
  variants.push({
    label: 'Marketing — Summer Tour 2026 (local render)',
    file: 'local-marketing-summer-tour.html',
    subject: subject || "Bring your crew → Summer Tour starts Tuesday, July 7.",
    html,
    text: text || 'Summer Tour preview (see HTML)',
  });
}

{
  const { buildBrandedEmailHtml } = require(resolve(root, 'functions/commsEmailWorker.js'));
  const html = buildBrandedEmailHtml({
    siteUrl,
    bodyText: [
      'Hi Pat,',
      '',
      'This is a local preview of the service comms branded shell (account welcome, recap, etc.).',
      '',
      '— Setlist Pick\'em',
    ].join('\n'),
    ctaUrl: `${siteUrl}/dashboard`,
    settingsUrl: `${siteUrl}/dashboard/profile/notifications`,
  });
  variants.push({
    label: 'Service — branded shell (local render)',
    file: 'local-service-branded-shell.html',
    subject: '[LOCAL PREVIEW] Setlist Pick\'em branded service email',
    html,
    text: 'Local preview of service comms shell.',
  });
}

for (const v of variants) {
  const outFile = resolve(outDir, v.file);
  writeFileSync(outFile, v.html, 'utf8');
  console.log(`✓ ${v.label}\n  ${outFile}`);
  if (v.html.includes('web-app-manifest-512x512.png')) {
    console.log('  Logo: web-app-manifest-512x512.png (large vinyl in-body)');
  }
}

const primary = resolve(outDir, variants[0].file);
if (!sendTo && process.platform === 'darwin') {
  execSync(`open "${primary}"`);
}

const resendKey = process.env.RESEND_API_KEY;
if (sendTo) {
  if (!resendKey || !resendKey.startsWith('re_')) {
    console.error('\n✗ --send requires RESEND_API_KEY in .env or environment.');
    console.error('  Get it from Firebase Secret Manager / Resend dashboard, then:');
    console.error('  RESEND_API_KEY=re_xxx node scripts/send-local-email-preview.mjs --send pat@road2media.com');
    process.exit(1);
  }
  const pick = variants[0];
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: "Setlist Pick'em <updates@setlistpickem.com>",
      to: [sendTo],
      subject: `[LOCAL PREVIEW] ${pick.subject}`,
      html: pick.html,
      text: pick.text,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('\n✗ Resend error:', res.status, JSON.stringify(json, null, 2));
    process.exit(1);
  }
  console.log(`\n✓ Sent to ${sendTo} (id: ${json.id || 'unknown'})`);
  console.log('  Note: inbox list badge may still show blue circle until BIMI (#498).');
}
