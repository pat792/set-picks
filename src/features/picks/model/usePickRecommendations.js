import { useEffect, useState } from 'react';

import { resolvePickRecommendationsFetchUrl } from '../api/pickRecommendationsUrl.js';
import {
  PICK_RECOMMENDATIONS_CACHE_KEY,
  PICK_RECOMMENDATIONS_CACHE_MAX_AGE_MS,
} from './pickRecommendationsConstants.js';
import { selectPickRecommendations } from './selectPickRecommendations.js';

/**
 * @typedef {{ fetchedAt: number, artifact: object }} RecCacheV1
 */

/**
 * @returns {RecCacheV1 | null}
 */
function readCache() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PICK_RECOMMENDATIONS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.fetchedAt !== 'number' ||
      !parsed.artifact
    ) {
      return null;
    }
    return /** @type {RecCacheV1} */ (parsed);
  } catch {
    return null;
  }
}

/**
 * @param {RecCacheV1} entry
 */
function writeCache(entry) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PICK_RECOMMENDATIONS_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Loads versioned pick recommendations from Storage with TTL + stale fallback (#650).
 * Returns null artifact when unavailable (Lab / Predictive Mode stay dark).
 *
 * @returns {{
 *   artifact: object | null,
 *   loadError: Error | null,
 *   isLoading: boolean,
 *   loadedFromCache: boolean,
 * }}
 */
export function usePickRecommendations() {
  const [artifact, setArtifact] = useState(/** @type {object | null} */ (null));
  const [loadError, setLoadError] = useState(/** @type {Error | null} */ (null));
  const [resolved, setResolved] = useState(false);
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;

    async function load() {
      setLoadError(null);
      setLoadedFromCache(false);

      const now = Date.now();
      const cached = readCache();
      const cachedOk =
        cached && selectPickRecommendations(cached.artifact);

      if (
        cachedOk &&
        now - cached.fetchedAt < PICK_RECOMMENDATIONS_CACHE_MAX_AGE_MS
      ) {
        if (!cancelled) {
          setArtifact(cached.artifact);
          setLoadedFromCache(true);
          setResolved(true);
        }
        return;
      }

      let url;
      try {
        url = await resolvePickRecommendationsFetchUrl();
      } catch (e) {
        if (ac.signal.aborted || cancelled) return;
        if (cachedOk) {
          setArtifact(cached.artifact);
          setResolved(true);
          return;
        }
        setArtifact(null);
        setLoadError(e instanceof Error ? e : new Error(String(e)));
        setResolved(true);
        return;
      }

      try {
        const res = await fetch(url, {
          signal: ac.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          throw new Error(`Pick recommendations HTTP ${res.status}`);
        }
        const body = await res.json();
        const selected = selectPickRecommendations(body);
        if (!selected) {
          throw new Error('Pick recommendations JSON failed validation.');
        }
        writeCache({ fetchedAt: Date.now(), artifact: selected });
        if (!cancelled) {
          setArtifact(selected);
          setResolved(true);
        }
      } catch (e) {
        if (ac.signal.aborted || cancelled) return;
        if (cachedOk) {
          setArtifact(cached.artifact);
          setLoadError(null);
          setResolved(true);
          return;
        }
        setArtifact(null);
        setLoadError(e instanceof Error ? e : new Error(String(e)));
        setResolved(true);
      }
    }

    load();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  return {
    artifact,
    loadError,
    isLoading: !resolved,
    loadedFromCache,
  };
}
