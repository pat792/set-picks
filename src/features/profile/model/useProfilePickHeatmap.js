import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { computeProfilePickHeatmap } from '../api/profilePickHeatmap';
import { emitProfilePickHeatmapTelemetry } from './profilePickHeatmapTelemetry';

/**
 * Self-Profile top-picks heatmap (#553). Live-compute only — do not enable
 * for public profiles until a rollup lands.
 *
 * @param {string | undefined} uid
 * @param {{ enabled?: boolean }} [options]
 */
export function useProfilePickHeatmap(uid, options = {}) {
  const trimmedUid = typeof uid === 'string' ? uid.trim() : '';
  const enabled = options.enabled !== false && trimmedUid.length > 0;

  const lastComputeTelemetryRef = useRef(
    /**
     * @type {{
     *   shows_checked: number,
     *   shows_played: number,
     *   collection_queries: number,
     *   setlist_reads: number,
     *   elapsed_ms: number,
     * } | null}
     */ (null)
  );

  const query = useQuery({
    queryKey: ['profile-pick-heatmap', trimmedUid],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const startedAt =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();
      /** @type {import('../api/profilePickHeatmap').ProfilePickHeatmapTelemetry | null} */
      let captured = null;
      try {
        return await computeProfilePickHeatmap(trimmedUid, {
          onTelemetry: (t) => {
            captured = { ...t };
          },
        });
      } finally {
        const endedAt =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
        if (captured) {
          lastComputeTelemetryRef.current = {
            shows_checked: captured.shows_checked,
            shows_played: captured.shows_played,
            collection_queries: captured.collection_queries,
            setlist_reads: captured.setlist_reads,
            elapsed_ms: endedAt - startedAt,
          };
        }
      }
    },
  });

  const emittedForFetchKeyRef = useRef(/** @type {string | null} */ (null));
  useEffect(() => {
    if (!enabled || !query.isSuccess) return;
    const fetchKey = `${trimmedUid}:${query.isFetchedAfterMount ? 'fresh' : 'cached'}`;
    if (emittedForFetchKeyRef.current === fetchKey) return;
    emittedForFetchKeyRef.current = fetchKey;

    const cacheHit = !query.isFetchedAfterMount;
    const computeTelemetry =
      !cacheHit && lastComputeTelemetryRef.current
        ? lastComputeTelemetryRef.current
        : {
            shows_checked: 0,
            shows_played: 0,
            collection_queries: 0,
            setlist_reads: 0,
            elapsed_ms: 0,
          };

    emitProfilePickHeatmapTelemetry({
      ...computeTelemetry,
      self_view: true,
      cache_hit: cacheHit,
      source: 'live',
    });
  }, [enabled, query.isSuccess, query.isFetchedAfterMount, trimmedUid]);

  return {
    rows: query.data?.rows ?? [],
    songTitles: query.data?.songTitles ?? [],
    showsAggregated: query.data?.showsAggregated ?? 0,
    showsAvailable: query.data?.showsAvailable ?? 0,
    loading: query.isPending || query.isFetching,
    error: query.error,
  };
}
