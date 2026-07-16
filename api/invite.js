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
 *   • For **social crawlers**: serves a minimal HTML page with personalized OG
 *     meta tags (pool name / inviter handle via Firebase Admin when needed).
 *
 *   • For **regular browsers**: serves the built SPA shell (dist/index.html)
 *     with cheap static OG injection — no Firestore round trip.
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
// SPA shell loader (reads dist/index.html bundled via includeFiles)
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));

let _spaTemplate = undefined;

function loadSpaTemplate() {
  if (_spaTemplate !== undefined) return _spaTemplate;

  const candidates = [
    join(process.cwd(), 'dist', 'index.html'),
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

  _spaTemplate = null;
  return null;
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

  if (!isCrawler) {
    const spaHtml = loadSpaTemplate();
    if (spaHtml) {
      const html = injectOgIntoSpa(spaHtml, og);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      return res.status(200).send(html);
    }
  }

  const html = buildCrawlerHtml(og);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return res.status(200).send(html);
}
