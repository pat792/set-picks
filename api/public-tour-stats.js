/**
 * Public tour-stats JSON (#832 / #827) — no browser App Check / Firebase SDK.
 *
 * GET /api/public-tour-stats?slug=_index
 * GET /api/public-tour-stats?slug=2026-sphere
 *
 * Reads `public_tour_stats/{slug}` via Admin SDK. CDN-friendly cache headers
 * so cold marketing opens avoid reCAPTCHA + client Firestore.
 *
 * Required Vercel env: FIREBASE_SERVICE_ACCOUNT (same as api/invite.js).
 */

/** @type {Promise<{ getApps: Function, initializeApp: Function, cert: Function, getFirestore: Function }> | null} */
let adminModsPromise = null;

function loadAdminMods() {
  if (!adminModsPromise) {
    adminModsPromise = Promise.all([
      import('firebase-admin/app'),
      import('firebase-admin/firestore'),
    ]).then(([appMod, fsMod]) => ({
      getApps: appMod.getApps,
      initializeApp: appMod.initializeApp,
      cert: appMod.cert,
      getFirestore: fsMod.getFirestore,
    }));
  }
  return adminModsPromise;
}

async function initAdmin() {
  const { getApps, initializeApp, cert } = await loadAdminMods();
  if (getApps().length > 0) return;
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) {
    initializeApp({ credential: cert(JSON.parse(sa)) });
  } else {
    initializeApp();
  }
}

/**
 * @param {string} raw
 * @returns {string | null}
 */
function normalizeSlug(raw) {
  const slug = String(raw ?? '').trim();
  if (!slug) return '_index';
  if (slug === '_index') return '_index';
  // Tour slugs are kebab-case labels; reject path traversal / odd shapes.
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) return null;
  if (slug.startsWith('_') && slug !== '_index') return null;
  return slug;
}

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const slug = normalizeSlug(req.query?.slug);
  if (!slug) {
    res.status(400).json({ error: 'Invalid slug' });
    return;
  }

  try {
    await initAdmin();
    const { getFirestore } = await loadAdminMods();
    const db = getFirestore();
    const snap = await db.collection('public_tour_stats').doc(slug).get();
    if (!snap.exists) {
      res.writeHead(404, CACHE_HEADERS);
      res.end(JSON.stringify({ notFound: true, slug }));
      return;
    }
    const data = snap.data() || {};
    res.writeHead(200, CACHE_HEADERS);
    res.end(JSON.stringify(data));
  } catch (err) {
    console.error('public-tour-stats:', err instanceof Error ? err.message : err);
    res.status(502).json({ error: 'Tour stats unavailable' });
  }
}
