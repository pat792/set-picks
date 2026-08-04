/**
 * Route-chunk prefetch registry (#805).
 *
 * Features must never import app-layer route modules (FSD boundary), but they
 * are the surfaces that know when a chunk is about to be needed — an auth modal
 * opening is the strongest signal that `dashboard` / `setup` are next.
 *
 * The app layer registers loaders by string key; features prefetch by key.
 */

/** @typedef {'home' | 'setup' | 'dashboard'} RouteChunkKey */

/** @type {Map<string, () => Promise<unknown>>} */
const loaders = new Map();
/** Keys whose import has already been kicked off (per page load). */
const started = new Set();

/**
 * Register dynamic-import loaders for prefetchable top-level routes.
 * Called once from the app layer; re-registering a key replaces its loader.
 *
 * @param {Record<string, () => Promise<unknown>>} entries
 */
export function registerRouteChunkLoaders(entries) {
  if (!entries || typeof entries !== 'object') return;
  for (const [key, load] of Object.entries(entries)) {
    if (typeof load !== 'function') continue;
    loaders.set(key, load);
  }
}

/**
 * Kick off the dynamic import for one or more registered route chunks.
 * Unknown keys and repeat calls are no-ops; a failed import is retryable.
 *
 * @param {string | string[]} keys
 */
export function prefetchRouteChunk(keys) {
  if (typeof window === 'undefined') return;
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    if (started.has(key)) continue;
    const load = loaders.get(key);
    if (!load) continue;
    started.add(key);
    try {
      Promise.resolve(load()).catch(() => {
        started.delete(key);
      });
    } catch {
      started.delete(key);
    }
  }
}

/** @returns {string[]} registered keys, for diagnostics and tests. */
export function registeredRouteChunkKeys() {
  return [...loaders.keys()];
}

/** Test-only: drop registrations and prefetch bookkeeping. */
export function resetRouteChunkPrefetch() {
  loaders.clear();
  started.clear();
}
