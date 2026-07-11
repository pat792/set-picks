/**
 * Vercel Serverless Function — dynamic OG tags for /join/:code invite links.
 *
 * Flat `api/invite.js` + `?code=` query (vercel.json rewrite) — nested
 * `api/invite/[code].js` never registered on Vercel deploy (same class of bug
 * as api/email-click; see f883d02).
 *
 * Social crawlers (Facebook, Instagram, Twitter, Slack, …) don't execute
 * JavaScript, so they can't read OG tags injected by React. This function
 * intercepts every /join/:code request and:
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
const SITE_NAME = "Setlist Pick 'Em";
const DEFAULT_OG_IMAGE =
  'https://www.setlistpickem.com/branding/og-card-1200x630.jpg?v=20260711';
const DEFAULT_OG_IMAGE_ALT = "Setlist Pick 'Em — live setlist prediction game";
const DEFAULT_TITLE = "Setlist Pick'em | The Ultimate Live Music Prediction Game";
const DEFAULT_DESCRIPTION =
  "Setlist Pick 'Em is a free live setlist prediction game for Phish fans. Pick openers, closers, encore, and a wildcard before each show; scores update in real time as songs are played. Compete in a global pool or create private pools with friends.";

// Social-crawler user-agent detection (case-insensitive substring match).
// Instagram link previews use Meta's `facebookexternalhit` scraper — do NOT
// match bare `Instagram` (the in-app browser UA contains that token).
const CRAWLER_RE =
  /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|TelegramBot|Discordbot|redditbot|Applebot|Googlebot|bingbot|ia_archiver/i;

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

function buildOgMetaTags({ title, description, url, image, imageAlt = DEFAULT_OG_IMAGE_ALT }) {
  return [
    `  <title>${escapeHtml(title)}</title>`,
    `  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `  <meta property="og:title" content="${escapeHtml(title)}" />`,
    `  <meta property="og:description" content="${escapeHtml(description)}" />`,
    `  <meta property="og:image" content="${escapeHtml(image)}" />`,
    `  <meta property="og:image:secure_url" content="${escapeHtml(image)}" />`,
    `  <meta property="og:image:type" content="image/jpeg" />`,
    `  <meta property="og:image:width" content="1200" />`,
    `  <meta property="og:image:height" content="630" />`,
    `  <meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />`,
    `  <meta property="og:url" content="${escapeHtml(url)}" />`,
    `  <meta property="og:type" content="website" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `  <meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `  <meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ].join('\n');
}

/**
 * Builds a minimal OG-tagged HTML shell for social crawlers.
 * Browsers never see this; they get the full SPA shell instead.
 */
function buildCrawlerHtml(og) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
${buildOgMetaTags(og)}
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
function injectOgIntoSpa(spaHtml, og) {
  const dynamicTags = buildOgMetaTags(og);

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
    join(process.cwd(), 'dist', 'index.html'), // /var/task/dist/index.html
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
  const ua = req.headers['user-agent'] ?? '';
  const isCrawler = CRAWLER_RE.test(ua);

  // 1. Regular browsers: serve the SPA shell immediately — no Firestore round
  //    trip. Marketing-email /join/:code clicks were paying a cold-start Admin
  //    lookup on every load even though only crawlers consume OG meta tags.
  if (!isCrawler) {
    const spaHtml = loadSpaTemplate();
    if (spaHtml) {
      let title = DEFAULT_TITLE;
      let description = DEFAULT_DESCRIPTION;
      if (code) {
        title = "Join my Setlist Pick 'Em pool!";
        description =
          "You've been invited to a private Setlist Pick 'Em pool. Pick your setlist and compete to win.";
      }
      const og = { title, description, url: inviteUrl, image: DEFAULT_OG_IMAGE };
      const html = injectOgIntoSpa(spaHtml, og);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      return res.status(200).send(html);
    }
    // dist/index.html not available (local dev without a prior build).
    // Fall through to crawler path — acceptable in dev.
  }

  // 2. Crawlers (or dev fallback): resolve pool-specific OG copy from Firestore.
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

  // 3. Lightweight OG-tagged shell for crawlers (or dev without dist/).
  const html = buildCrawlerHtml(og);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return res.status(200).send(html);
}
