/** localStorage key for cached Phish.net-derived catalog JSON. */
export const SONG_CATALOG_CACHE_KEY = 'set-picks.songCatalogCache.v1';

/** Skip network if cache was written within this window (3 days). */
export const SONG_CATALOG_CACHE_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;
