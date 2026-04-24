/** localStorage key for cached Phish.net-derived catalog JSON. */
export const SONG_CATALOG_CACHE_KEY = 'set-picks.songCatalogCache.v1';

/**
 * Skip network if cache was written within this window (6 hours).
 *
 * Intentionally matches the server-side refresh cadence of
 * `scheduledPhishnetSongCatalog` (every 6 hours ET — see functions/index.js).
 * Keeping the two windows aligned means a user who reloads shortly after a
 * cron run sees the fresh catalog, and worst-case user-visible drift is
 * bounded by one cron window (~6h) rather than 3 days + cron window. This
 * closes the reported mismatch where displayed `Gap` lagged days behind the
 * most recent show date vs. the song's `last_played` (#261).
 */
export const SONG_CATALOG_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
