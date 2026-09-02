/**
 * Same-origin CDN snapshot + session cache for public tour-stats (#869).
 * Paths are written at build by `scripts/prerender-seo.mjs`.
 */

export const PUBLIC_TOUR_STATS_FIRESTORE_PROJECT_ID = 'set-picks';
export const PUBLIC_TOUR_STATS_CDN_PREFIX = '/tour-stats-data';
export const PUBLIC_TOUR_STATS_CACHE_VERSION = 'v1';

const INDEX_CACHE_KEY = `sp.publicTourStats.${PUBLIC_TOUR_STATS_CACHE_VERSION}.index`;

/**
 * @param {string} [docId] `_index` or a tour slug
 * @returns {string}
 */
export function publicTourStatsCdnUrl(docId = '_index') {
  const id = String(docId ?? '').trim() || '_index';
  return `${PUBLIC_TOUR_STATS_CDN_PREFIX}/${encodeURIComponent(id)}.json`;
}

/**
 * @returns {Storage | null}
 */
function getSessionStorage() {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  } catch {
    // Safari Private can throw on storage access.
    return null;
  }
}

/**
 * @param {string} key
 * @returns {unknown | null}
 */
function readJson(key) {
  const store = getSessionStorage();
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {unknown} value
 */
function writeJson(key, value) {
  const store = getSessionStorage();
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // Quota / private-mode write failures are non-fatal.
  }
}

/**
 * @returns {{ tours: unknown[], defaultTourSlug?: string } | null}
 */
export function readCachedPublicTourStatsIndex() {
  const data = readJson(INDEX_CACHE_KEY);
  if (!data || typeof data !== 'object' || !Array.isArray(data.tours)) {
    return null;
  }
  return data;
}

/**
 * @param {{ tours: unknown[], defaultTourSlug?: string }} index
 */
export function writeCachedPublicTourStatsIndex(index) {
  if (!index || !Array.isArray(index.tours)) return;
  writeJson(INDEX_CACHE_KEY, index);
}

/**
 * @param {string} slug
 * @returns {string}
 */
function docCacheKey(slug) {
  return `sp.publicTourStats.${PUBLIC_TOUR_STATS_CACHE_VERSION}.doc.${slug}`;
}

/**
 * @param {string} slug
 * @returns {Record<string, unknown> | null}
 */
export function readCachedPublicTourStatsDoc(slug) {
  const id = String(slug ?? '').trim();
  if (!id || id.startsWith('_')) return null;
  const data = readJson(docCacheKey(id));
  if (!data || typeof data !== 'object') return null;
  return data;
}

/**
 * @param {string} slug
 * @param {Record<string, unknown>} doc
 */
export function writeCachedPublicTourStatsDoc(slug, doc) {
  const id = String(slug ?? '').trim();
  if (!id || id.startsWith('_') || !doc || typeof doc !== 'object') return;
  writeJson(docCacheKey(id), doc);
}
