/**
 * Vercel Serverless Function — dynamic OG tags for invite landings.
 *
 * Flat `api/invite.js` + query params (vercel.json rewrites) — nested
 * `api/invite/[code].js` never registered on Vercel deploy (same class of bug
 * as api/email-click; see f883d02).
 *
 * Rewrites:
 *   • `/join/:code`   → `/api/invite?code=:code` (+ unmatched query, e.g. `from`)
 *   • `/invite/:handle` → `/api/invite?handle=:handle`
 *
 * Social crawlers don't execute JavaScript, so they can't read OG tags injected
 * by React. This function intercepts invite requests and:
 *
 *   • Prefer the built SPA shell (`dist/index.html`) with static OG injection for
 *     **both** browsers and crawlers (crawlers read meta; browsers boot React).
 *   • If the shell is missing from the function bundle, fetch the live site `/`
 *     HTML as a fallback (same hashed asset URLs on the CDN).
 *   • Only when the SPA shell is unavailable: crawlers get minimal OG HTML;
 *     browsers get a non-blank 503 (never empty `<body></body>`).
 *
 * Fallback: if Firestore is unreachable or lookups fail, generic default OG
 * tags are used — invite links still work in the SPA.
 *
 * Required Vercel env var:
 *   FIREBASE_SERVICE_ACCOUNT — JSON string of the Firebase service account.
 *
 * Issues #128, #582.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import {
  SITE_URL,
  buildCrawlerHtml,
  buildInvitePageUrl,
  CRAWLER_RE,
  DEFAULT_OG_IMAGE,
  injectOgIntoSpa,
  normalizeInviteHandle,
  resolveInviteOgContent,
} from './inviteOgHelpers.mjs';

// ---------------------------------------------------------------------------
// Firebase Admin — lazy singleton
// ---------------------------------------------------------------------------

function initAdmin() {
  if (getApps().length > 0) return;
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) {
    initializeApp({ credential: cert(JSON.parse(sa)) });
  } else {
    initializeApp();
  }
}

/**
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

/**
 * Mirrors client `fetchPublicProfileByHandle` (users collection, exact handle).
 * @param {string} handle — normalized
 * @returns {Promise<{ handle?: string } | null>}
 */
async function fetchPublicProfileByHandle(handle) {
  const h = normalizeInviteHandle(handle);
  if (!h) return null;
  initAdmin();
  const db = getFirestore();
  const snap = await db
    .collection('users')
    .where('handle', '==', h)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].data();
}

// ---------------------------------------------------------------------------
// SPA shell loader (disk includeFiles, then live-site fetch fallback)
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {string | null | undefined} */
let _spaTemplate = undefined;

function looksLikeSpaShell(html) {
  return (
    typeof html === 'string' &&
    html.includes('id="root"') &&
    (html.includes('type="module"') || html.includes('/assets/'))
  );
}

function loadSpaTemplateFromDisk() {
  const candidates = [
    join(process.cwd(), 'dist', 'index.html'),
    join(__dirname, '..', 'dist', 'index.html'),
    join(__dirname, 'dist', 'index.html'),
  ];

  for (const p of candidates) {
    try {
      const html = readFileSync(p, 'utf8');
      if (looksLikeSpaShell(html)) return html;
    } catch {
      // try next candidate
    }
  }
  return null;
}

/**
 * Resolve SPA index HTML. Prefer the Vercel-bundled `dist/index.html`; if the
 * function package omitted it, fetch production `/` (static) so browsers never
 * receive the empty crawler stub.
 *
 * @returns {Promise<string | null>}
 */
async function loadSpaTemplate() {
  if (_spaTemplate !== undefined) return _spaTemplate;

  const fromDisk = loadSpaTemplateFromDisk();
  if (fromDisk) {
    _spaTemplate = fromDisk;
    return _spaTemplate;
  }

  try {
    const res = await fetch(`${SITE_URL}/`, {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'set-picks-invite-og/1.0',
      },
      redirect: 'follow',
    });
    if (res.ok) {
      const html = await res.text();
      if (looksLikeSpaShell(html)) {
        _spaTemplate = html;
        return _spaTemplate;
      }
    }
    console.error(
      '[og-invite] SPA fetch fallback unexpected response',
      res.status,
    );
  } catch (err) {
    console.error('[og-invite] SPA fetch fallback failed:', err?.message ?? err);
  }

  _spaTemplate = null;
  return null;
}

function sendSpa(res, spaHtml, og) {
  const html = injectOgIntoSpa(spaHtml, og);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  return res.status(200).send(html);
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  const code = String(req.query.code ?? '').trim().toUpperCase();
  const handle = normalizeInviteHandle(req.query.handle ?? '');
  const from = normalizeInviteHandle(req.query.from ?? '');
  const isSiteInvite = Boolean(handle) && !code;

  const ua = req.headers['user-agent'] ?? '';
  const isCrawler = CRAWLER_RE.test(ua);

  let poolName = null;
  /** @type {boolean | undefined} */
  let siteProfileFound;

  if (isCrawler) {
    try {
      if (isSiteInvite) {
        const profile = await fetchPublicProfileByHandle(handle);
        siteProfileFound = Boolean(profile);
      } else if (code) {
        const pool = await fetchPoolByCode(code);
        poolName = pool?.name ? String(pool.name).trim() : null;
      }
    } catch (err) {
      console.error('[og-invite] Firestore lookup failed:', err?.message ?? err);
      if (isSiteInvite) siteProfileFound = false;
    }
  }

  const { title, description } = resolveInviteOgContent({
    code,
    handle: isSiteInvite ? handle : '',
    from,
    poolName,
    siteProfileFound,
  });

  const pageUrl = buildInvitePageUrl({
    code,
    handle: isSiteInvite ? handle : '',
    from,
  });

  const og = { title, description, url: pageUrl, image: DEFAULT_OG_IMAGE };

  const spaHtml = await loadSpaTemplate();
  if (spaHtml) {
    return sendSpa(res, spaHtml, og);
  }

  // SPA shell unavailable — crawlers still need OG; browsers must not get a blank page.
  if (isCrawler) {
    const html = buildCrawlerHtml(og);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    return res.status(200).send(html);
  }

  console.error('[og-invite] SPA shell unavailable for browser request');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(503).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invite temporarily unavailable</title>
  <meta http-equiv="refresh" content="2;url=/" />
</head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#0b1020;color:#e2e8f0;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:1.5rem;text-align:center;">
  <p>Invite page is temporarily unavailable. Redirecting home…</p>
</body>
</html>`);
}
