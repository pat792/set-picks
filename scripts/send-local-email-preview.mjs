#!/usr/bin/env node
/**
 * Render service / marketing email HTML and optionally send a **production-fidelity**
 * test via Resend (CID wordmark attachment — same path as Cloud Functions).
 *
 * Usage:
 *   node scripts/send-local-email-preview.mjs --service
 *     # writes production HTML (cid: — image won't show in browser) + opens it
 *   node scripts/send-local-email-preview.mjs --service --send pat@you.com
 *     # REQUIRED before batch sends — verifies wordmark in a real inbox (Gmail, etc.)
 *   node scripts/send-local-email-preview.mjs --tour-countdown --send pat@you.com
 *     # tour-countdown T-1 sample through the same production shell
 *   node scripts/send-local-email-preview.mjs --picks-lock-reminder --send pat@you.com
 *     # show-day lock reminder for users with no picks (#524)
 *   node scripts/send-local-email-preview.mjs --browser-only
 *     # optional: also write a data:-URI file that renders in Chrome (NOT send fidelity)
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

// Load .env (gitignored). Shell exports win unless empty or a known placeholder / invalid Resend key.
const envPath = resolve(root, '.env');
/** @type {Record<string, string>} */
const fileEnv = {};
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    fileEnv[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
  }
} catch {
  // optional
}

function shouldApplyEnvFile(key, fileValue) {
  const existing = process.env[key];
  if (existing == null || existing === '') return true;
  if (key === 'RESEND_API_KEY') {
    const ok = typeof fileValue === 'string' && fileValue.startsWith('re_');
    const shellOk = typeof existing === 'string' && existing.startsWith('re_');
    return ok && !shellOk;
  }
  return false;
}

for (const [key, value] of Object.entries(fileEnv)) {
  if (shouldApplyEnvFile(key, value)) {
    process.env[key] = value;
  }
}

const args = process.argv.slice(2);
const sendTo = args.includes('--send') ? args[args.indexOf('--send') + 1] : null;
const serviceOnly = args.includes('--service');
const tourCountdown = args.includes('--tour-countdown');
const picksLockReminder = args.includes('--picks-lock-reminder');
const browserOnly = args.includes('--browser-only');
const marketing = !serviceOnly && !tourCountdown && !picksLockReminder;

const outDir = resolve(root, 'emails/preview');
mkdirSync(outDir, { recursive: true });

const siteUrl = 'https://www.setlistpickem.com';
const settingsUrl = `${siteUrl}/dashboard/profile/notifications`;

const { buildProductionBrandedEmailShell } = require(resolve(root, 'functions/commsEmailWorker.js'));
const { buildEmailWordmarkInlineSrc } = require(resolve(root, 'comms/emailBranding.cjs'));
const { buildEmailTrackedCtaUrl } = require(resolve(root, 'comms/emailLinks.cjs'));

/** @param {string} destination @param {{ triggerId?: string, templateId?: string, cta?: string }} meta */
function trackedCtaUrl(destination, meta = {}) {
  return buildEmailTrackedCtaUrl(destination, meta);
}

/** @type {{ label: string, file: string, subject: string, html: string, text: string, attachments?: object[] }[]} */
const variants = [];

if (marketing) {
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
    settingsUrl,
  });
  variants.push({
    label: 'Marketing — Summer Tour 2026 (local render)',
    file: 'local-marketing-summer-tour.html',
    subject: subject || "Bring your crew → Summer Tour starts Tuesday, July 7.",
    html,
    text: text || 'Summer Tour preview (see HTML)',
  });
}

if (serviceOnly || (!marketing && !tourCountdown && !picksLockReminder)) {
  const shell = buildProductionBrandedEmailShell({
    siteUrl,
    bodyText: [
      'Hi Pat,',
      '',
      'This is a local preview of the service comms branded shell (account welcome, recap, etc.).',
    ].join('\n'),
    ctaUrl: trackedCtaUrl(`${siteUrl}/dashboard`, {
      triggerId: 'account_welcome',
      templateId: 'account-welcome',
    }),
    settingsUrl,
    signOff: "See you on tour!",
  });
  variants.push({
    label: 'Service — branded shell (production path)',
    file: 'local-service-branded-shell.html',
    subject: '[LOCAL PREVIEW] Setlist Pick\'em branded service email',
    html: shell.html,
    text: 'Local preview of service comms shell.',
  });
}

if (tourCountdown) {
  const { renderCommsTemplate } = require(resolve(root, 'functions/commsTemplates.js'));
  const rendered = await renderCommsTemplate('tour-countdown', {
    handle: 'ArmenianMan',
    tour_name: '2026 Summer Tour',
    days_remaining: 1,
    first_show_date: '2026-07-07',
    first_show_venue: 'Kohl Center, Madison, WI',
    first_show_city: 'Madison, WI',
    lock_time_local: '7:55 PM',
  });
  const shell = buildProductionBrandedEmailShell({
    siteUrl,
    bodyText: rendered.email.text,
    ctaUrl: trackedCtaUrl(rendered.email.ctaUrl || `${siteUrl}/dashboard/picks`, {
      triggerId: 'tour_countdown',
      templateId: 'tour-countdown',
      cta: rendered.email.ctaLabel,
    }),
    settingsUrl,
    ctaLabel: rendered.email.ctaLabel,
    signOff: rendered.email.signOff,
  });
  variants.push({
    label: 'Service — tour-countdown T-1 (production path)',
    file: 'local-tour-countdown-t1.html',
    subject: rendered.email.subject,
    html: shell.html,
    text: rendered.email.text,
  });
}

if (picksLockReminder) {
  const { renderCommsTemplate } = require(resolve(root, 'functions/commsTemplates.js'));
  const rendered = await renderCommsTemplate('picks-lock-reminder', {
    handle: 'Pat',
    show_date: '2026-07-07',
    venue_name: 'Kohl Center',
    venue_city: 'Madison, WI',
    time_to_lock: '2 hours',
    lock_time_local: '7:55 PM',
  });
  const shell = buildProductionBrandedEmailShell({
    siteUrl,
    bodyText: rendered.email.text,
    ctaUrl: trackedCtaUrl(rendered.email.ctaUrl || `${siteUrl}/dashboard/picks`, {
      triggerId: 'picks_lock_reminder',
      templateId: 'picks-lock-reminder',
      cta: rendered.email.ctaLabel,
    }),
    settingsUrl,
    ctaLabel: rendered.email.ctaLabel,
    signOff: rendered.email.signOff,
  });
  variants.push({
    label: 'Service — picks-lock-reminder (production path, transactional)',
    file: 'local-picks-lock-reminder.html',
    subject: rendered.email.subject,
    html: shell.html,
    text: rendered.email.text,
  });
}

for (const v of variants) {
  const outFile = resolve(outDir, v.file);
  const productionBanner =
    '<!-- PRODUCTION PATH: wordmark is a hosted https:// URL (marketing-email pattern). Deploy public/branding/email-gradient-wordmark.png before --send QA. -->\n';
  writeFileSync(outFile, productionBanner + v.html, 'utf8');
  console.log(`✓ ${v.label}\n  ${outFile}`);
  if (v.html.includes('/branding/email-gradient-wordmark.png')) {
    console.log('  Wordmark: hosted /branding/email-gradient-wordmark.png');
  }
  if (browserOnly) {
    const browserHtml = v.html.replace(
      /https:\/\/www\.setlistpickem\.com\/branding\/email-gradient-wordmark\.png/g,
      buildEmailWordmarkInlineSrc(),
    );
    const browserFile = outFile.replace(/\.html$/, '.browser.html');
    writeFileSync(
      browserFile,
      '<!-- BROWSER-ONLY: data: URI — NOT send fidelity. Do not approve sends from this file. -->\n' +
        browserHtml,
      'utf8'
    );
    console.log(`  Browser-only (misleading for sends): ${browserFile}`);
  }
}

const primary = resolve(outDir, variants[0].file);
if (!sendTo && process.platform === 'darwin') {
  execSync(`open "${primary}"`);
  console.log(
    '\n⚠️  Hosted wordmark needs the PNG on production (public/branding/).',
  );
  console.log('    Before any batch send, run --send <your-email> and confirm in Gmail.');
}

const resendKey = process.env.RESEND_API_KEY;
if (sendTo) {
  if (!resendKey || !resendKey.startsWith('re_')) {
    console.error('\n✗ --send requires RESEND_API_KEY in .env or environment.');
    console.error('  Get it from Firebase Secret Manager / Resend dashboard, then:');
    console.error(
      '  RESEND_API_KEY=re_xxx node scripts/send-local-email-preview.mjs --tour-countdown --send pat@road2media.com',
    );
    process.exit(1);
  }
  const pick = variants[variants.length - 1];
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
  console.log(`\n✓ Sent production-fidelity preview to ${sendTo} (id: ${json.id || 'unknown'})`);
  console.log('  Check the inbox — wordmark should render. Browser HTML file is not sufficient QA.');
}
