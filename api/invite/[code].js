/**
 * Vercel Serverless Function — dynamic OG tags for /join/:code invite links.
 *
 * Social crawlers (Facebook, Twitter, Slack, …) don't execute JavaScript, so
 * they can't read OG tags injected by React. This function intercepts every
 * /join/:code request and:
 *
 *   • For **social crawlers**: serves a minimal HTML page with pool-specific
 *     OG meta tags fetched from Firestore via the Firebase Admin SDK.
 *
 *   • For **regular browsers**: serves the built SPA shell (dist/index.html)
 *     so React Router can handle the /join/:code route without a redirect
 *     loop. Vite's built output is bundled into the function at deploy time
 *     via vercel.json `includeFiles`.
 *
 * Fallback: if Firestore is unreachable or the invite code is unknown the
 * function falls back to the app's default OG tags — the invite link still
 * works, it just shows generic copy.
 *
 * Required Vercel env var:
 *   FIREBASE_SERVICE_ACCOUNT — JSON string of the Firebase service account
 *                              (enables Admin SDK without GCP ADC).
 *
 * Issue #128.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Constants (mirror src/shared/config/seo.js — must not import from src/)
// ---------------------------------------------------------------------------

const SITE_URL = 'https://www.setlistpickem.com';
const DEFAULT_OG_IMAGE = 'https://www.setlistpickem.com/branding/og-card-1200x630.png';
const DEFAULT_TITLE = "Setlist Pick'em | The Ultimate Live Music Prediction Game";
const DEFAULT_DESCRIPTION =
  "Setlist Pick 'Em is a free live setlist prediction game for Phish fans. Pick openers, closers, encore, and a wildcard before each show; scores update in real time as songs are played. Compete in a global pool or create private pools with friends.";

// Social-crawler user-agent detection (case-insensitive substring match).
const CRAWLER_RE =
  /facebookexternalhit|Twitterbot|WhatsApp|Slackbot|LinkedInBot|TelegramBot|Discordbot|redditbot|Applebot|Googlebot|bingbot|ia_archiver/i;

// ---------------------------------------------------------------------------
// Firebase Admin — lazy singleton
// ---------------------------------------------------------------------------

function initAdmin() {
  if (getApps().length > 0) return;
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) {
    initializeApp({ credential: cert(JSON.parse(sa)) });
  } else {
    // Application Default Credentials fallback (works in GCP environments).
    initializeApp();
  }
}

/**
 * Looks up a pool document by invite code.
 * @param {string} code — already upper-cased
 * @returns {Promise<{ name: string } | null>}
 */
async function fetchPoolByCode(code) {
  initAdmin();
  const db = getFirestore();
  const snap = await db
    .collection('pools')
    .where('inviteCode', '==', code)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].data();
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Builds a minimal OG-tagged HTML shell for social crawlers.
 * Browsers never see this; they get the full SPA shell instead.
 */
function buildCrawlerHtml({ title, description, url, image }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body></body>
</html>`;
}

/**
 * Injects dynamic OG meta tags into the built SPA shell (dist/index.html).
 * Tags are inserted immediately after <meta charset> so they appear before the
 * static defaults — Facebook and most parsers use the first occurrence.
 *
 * @param {string} spaHtml — contents of dist/index.html
 * @param {{ title: string, description: string, url: string, image: string }} og
 * @returns {string}
 */
function injectOgIntoSpa(spaHtml, { title, description, url, image }) {
  const dynamicTags = [
    `  <title>${escapeHtml(title)}</title>`,
    `  <meta property="og:title" content="${escapeHtml(title)}" />`,
    `  <meta property="og:description" content="${escapeHtml(description)}" />`,
    `  <meta property="og:image" content="${escapeHtml(image)}" />`,
    `  <meta property="og:url" content="${escapeHtml(url)}" />`,
    `  <meta property="og:type" content="website" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `  <meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `  <meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ].join('\n');

  // Insert dynamic tags right after <meta charset> (before any static defaults).
  return spaHtml.replace(
    /(<meta\s+charset[^>]*\/?>)/i,
    `$1\n${dynamicTags}`,
  );
}

// ---------------------------------------------------------------------------
// SPA shell loader (reads dist/index.html bundled via includeFiles)
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));

let _spaTemplate = undefined;

function loadSpaTemplate() {
  if (_spaTemplate !== undefined) return _spaTemplate;

  // Vercel bundles includeFiles relative to the project root into the function
  // working directory. Try the most likely paths.
  const candidates = [
    join(process.cwd(), 'dist', 'index.html'),          // /var/task/dist/index.html
    join(__dirname, '..', '..', 'dist', 'index.html'),  // relative to api/invite/
    join(__dirname, '..', 'dist', 'index.html'),
  ];

  for (const p of candidates) {
    try {
      _spaTemplate = readFileSync(p, 'utf8');
      return _spaTemplate;
    } catch {
      // try next candidate
    }
  }

  _spaTemplate = null; // negative-cache: dist not present (dev / build skipped)
  return null;
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  const code = String(req.query.code ?? '').trim().toUpperCase();
  const inviteUrl = `${SITE_URL}/join/${code}`;

  // 1. Resolve OG copy (best-effort; fall back to defaults on any error).
  // Keep "Join my … pool" wording aligned with client share/clipboard copy
  // (`buildPoolInviteShareTitle` in shareOrCopyInviteUrl.js).
  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESCRIPTION;

  if (code) {
    title = "Join my Setlist Pick 'Em pool!";
    description =
      "You've been invited to a private Setlist Pick 'Em pool. Pick your setlist and compete to win.";
    try {
      const pool = await fetchPoolByCode(code);
      if (pool?.name) {
        const poolName = String(pool.name).trim();
        if (poolName) {
          title = `Join my Setlist Pick 'Em pool: ${poolName}`;
          description = `Join my Setlist Pick 'Em pool — ${poolName}. Pick openers, closers, and more before each show.`;
        }
      }
    } catch (err) {
      console.error('[og-invite] Firestore lookup failed:', err?.message ?? err);
    }
  }

  const og = { title, description, url: inviteUrl, image: DEFAULT_OG_IMAGE };
  const ua = req.headers['user-agent'] ?? '';

  // 2. For regular browsers, serve the full SPA shell so React Router handles
  //    the /join/:code route client-side — no redirect loop.
  if (!CRAWLER_RE.test(ua)) {
    const spaHtml = loadSpaTemplate();
    if (spaHtml) {
      const html = injectOgIntoSpa(spaHtml, og);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      return res.status(200).send(html);
    }
    // dist/index.html not available (local dev without a prior build).
    // Fall through to serve the crawler shell — acceptable in dev.
  }

  // 3. For crawlers (or dev fallback): return a lightweight OG-tagged shell.
  const html = buildCrawlerHtml(og);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return res.status(200).send(html);
}
