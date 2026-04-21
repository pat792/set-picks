/**
 * Song catalog source for Cloud Function grading (issue #167).
 *
 * Reads the authoritative `song-catalog.json` that the weekly
 * `scheduledPhishnetSongCatalog` / admin `refreshPhishnetSongCatalog` callable
 * publishes to Firebase Storage, so live scoring uses the same catalog the
 * client uses (see `src/shared/data/phishSongs.js` / `useSongCatalog`).
 *
 * On any Storage problem (missing object, parse error, empty `songs`) we fall
 * back to the bundled `functions/phishSongs.js` so grading never hard-fails.
 *
 * Cached in-module for a short TTL to avoid re-reading Storage during a tight
 * live-night recompute loop (`gradePicksOnSetlistWrite` → `pollLiveSetlistNow`
 * can fire multiple times inside the same function instance).
 */

const admin = require("firebase-admin");
const { CATALOG_STORAGE_PATH } = require("./phishnetSongCatalog");

/** 5 minute in-memory cache; catalog refreshes weekly. */
const CACHE_TTL_MS = 5 * 60 * 1000;

let cached = null;

function isNonEmptySongArray(value) {
  if (!Array.isArray(value) || value.length === 0) return false;
  for (const item of value) {
    if (!item || typeof item !== "object") return false;
    if (typeof item.name !== "string" || !item.name.trim()) return false;
  }
  return true;
}

/**
 * Parse a `song-catalog.json` buffer/string and return its `songs` array,
 * or `null` when the payload is malformed / empty.
 *
 * @param {Buffer|string|null|undefined} buf
 * @returns {Array<{ name: string, gap?: string, total?: string, last?: string }> | null}
 */
function parseCatalogJson(buf) {
  if (buf == null) return null;
  let text;
  try {
    text = Buffer.isBuffer(buf) ? buf.toString("utf8") : String(buf);
  } catch {
    return null;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  return isNonEmptySongArray(data.songs) ? data.songs : null;
}

/**
 * Load the song catalog for grading. Storage with TTL cache; fallback on any
 * failure.
 *
 * @param {{
 *   fallbackSongs: Array<{ name: string, gap?: string }>,
 *   logger?: { info?: Function, warn?: Function, error?: Function },
 *   getBucket?: () => any,
 *   now?: () => number,
 *   cacheTtlMs?: number,
 * }} opts
 * @returns {Promise<Array<{ name: string, gap?: string }>>}
 */
async function loadSongCatalogSongs(opts) {
  const {
    fallbackSongs,
    logger,
    getBucket = () => admin.storage().bucket(),
    now = () => Date.now(),
    cacheTtlMs = CACHE_TTL_MS,
  } = opts || {};

  if (!Array.isArray(fallbackSongs)) {
    throw new Error("loadSongCatalogSongs: fallbackSongs array is required");
  }

  if (cached && now() - cached.fetchedAt < cacheTtlMs) {
    return cached.songs;
  }

  try {
    const file = getBucket().file(CATALOG_STORAGE_PATH);
    const [exists] = await file.exists();
    if (!exists) {
      logger?.warn?.(
        "song catalog: Storage object missing; using bundled fallback",
        { path: CATALOG_STORAGE_PATH }
      );
      return fallbackSongs;
    }
    const [buf] = await file.download();
    const songs = parseCatalogJson(buf);
    if (!songs) {
      logger?.warn?.(
        "song catalog: Storage payload invalid/empty; using bundled fallback",
        { path: CATALOG_STORAGE_PATH }
      );
      return fallbackSongs;
    }
    cached = { songs, fetchedAt: now() };
    logger?.info?.("song catalog: loaded from Storage", {
      songCount: songs.length,
      path: CATALOG_STORAGE_PATH,
    });
    return songs;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger?.warn?.(
      "song catalog: Storage read failed; using bundled fallback",
      msg
    );
    return fallbackSongs;
  }
}

function _resetSongCatalogCacheForTests() {
  cached = null;
}

module.exports = {
  loadSongCatalogSongs,
  parseCatalogJson,
  isNonEmptySongArray,
  _resetSongCatalogCacheForTests,
  CACHE_TTL_MS,
};
