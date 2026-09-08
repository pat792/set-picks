import { useEffect, useState } from 'react';

import { fetchFirstOkJson } from '../../../shared/lib/fetchFirstOkJson.js';
import { resolvePickRecommendationsFetchUrls } from '../api/pickRecommendationsUrl.js';
import { isPredictionLabEnabled } from './isPredictionLabEnabled.js';
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

/** Same-tab memory so Make Picks / Scorecard / Lab share one artifact. */
let memoryRec = /** @type {{ artifact: object, fetchedAt: number } | null} */ (null);

function readMemory() {
  if (!memoryRec) return null;
  if (Date.now() - memoryRec.fetchedAt >= PICK_RECOMMENDATIONS_CACHE_MAX_AGE_MS) {
    return null;
  }
  return memoryRec;
}

function writeMemory(artifact) {
  if (!artifact) return;
  memoryRec = { artifact, fetchedAt: Date.now() };
}

/**
 * Loads versioned pick recommendations from Storage with TTL + stale fallback (#650).
 * Returns null artifact when unavailable (Lab / Predictive Mode stay dark).
 * Defaults to no-op when `VITE_ENABLE_PREDICTION_LAB` is not exactly `'true'`.
 * Pass `{ enabled: true }` to fetch for Scorecard odds even when Lab UI is off.
 *
 * @param {{ enabled?: boolean }} [options]
 * @returns {{
 *   artifact: object | null,
 *   loadError: Error | null,
 *   isLoading: boolean,
 *   loadedFromCache: boolean,
 * }}
 */
export function usePickRecommendations(options = {}) {
  const enabled = options.enabled ?? isPredictionLabEnabled();
  const [artifact, setArtifact] = useState(
    () => readMemory()?.artifact ?? null,
  );
  const [loadError, setLoadError] = useState(/** @type {Error | null} */ (null));
  const [resolved, setResolved] = useState(
    () => !enabled || Boolean(readMemory()?.artifact),
  );
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

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
          writeMemory(cached.artifact);
          setArtifact(cached.artifact);
          setLoadedFromCache(true);
          setResolved(true);
        }
        return;
      }

      let urls;
      try {
        urls = await resolvePickRecommendationsFetchUrls();
      } catch (e) {
        if (ac.signal.aborted || cancelled) return;
        if (cachedOk) {
          writeMemory(cached.artifact);
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
        const body = await fetchFirstOkJson(urls, { signal: ac.signal });
        const selected = selectPickRecommendations(body);
        if (!selected) {
          throw new Error('Pick recommendations JSON failed validation.');
        }
        writeCache({ fetchedAt: Date.now(), artifact: selected });
        writeMemory(selected);
        if (!cancelled) {
          setArtifact(selected);
          setResolved(true);
        }
      } catch (e) {
        if (ac.signal.aborted || cancelled) return;
        if (cachedOk) {
          writeMemory(cached.artifact);
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
  }, [enabled]);

  return {
    artifact,
    loadError,
    isLoading: !resolved,
    loadedFromCache,
  };
}
