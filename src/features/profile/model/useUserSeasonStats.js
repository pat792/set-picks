import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { todayYmd } from '../../../shared/utils/dateUtils';
import { useAuth } from '../../auth';
import { useShowCalendar } from '../../show-calendar';
import {
  EMPTY_USER_SEASON_STATS,
  computeUserSeasonStats,
} from '../api/profileSeasonStats';
import { emitProfileSeasonStatsTelemetry } from './profileStatsTelemetry';

/**
 * @param {Array<{ date: string }>} showDates
 * @returns {string}
 */
function deriveShowDatesKey(showDates) {
  if (!Array.isArray(showDates) || showDates.length === 0) return '';
  return showDates
    .map((s) => (s && typeof s.date === 'string' ? s.date : ''))
    .filter(Boolean)
    .join('|');
}

/**
 * Heuristic for "the most recent finalized show the client is aware of" —
 * the max calendar date on or before today. Used by
 * `computeUserSeasonStats` (#244) to decide whether the `users/{uid}`
 * materialized snapshot is fresh enough to short-circuit the
 * live-compute fallback.
 *
 * Today's show may not have been rolled up yet (finalize is still manual);
 * if that's the case for the most-recent-show user, the snapshot will be
 * stale and they'll fall back to live-compute for one profile view until
 * the next rollup catches up. Acceptable trade-off vs. a second Firestore
 * read to load a global "last rolled up show" marker.
 *
 * @param {Array<{ date: string }>} showDates
 * @returns {string | null}
 */
function deriveLatestFinalizedShow(showDates) {
  if (!Array.isArray(showDates) || showDates.length === 0) return null;
  const today = todayYmd();
  let latest = null;
  for (const s of showDates) {
    const d = s && typeof s.date === 'string' ? s.date : '';
    if (!d || d > today) continue;
    if (!latest || d > latest) latest = d;
  }
  return latest;
}

/**
 * Season totals for a user's public profile.
 *
 * As of #244, prefers the `rollupScoresForShow`-materialized aggregates on
 * `users/{uid}` (single point read) when the snapshot is caught up; falls
 * back to the live-compute pipeline (|showDates| point reads + |showsPlayed|
 * collection queries) otherwise.
 *
 * - `totalPoints` / `shows` come from the user's own graded picks.
 * - `wins` = shows won overall (global high score across every graded pick
 *   for that show), not pool-scoped wins — a user who won 3 shows total is
 *   credited 3, regardless of how many pools they're in.
 *
 * Wrapped with React Query in #243 so back-navigation within the session
 * reuses cached stats per `(uid, showDatesKey)` instead of re-issuing the
 * (materialized or live-compute) reads on every mount.
 *
 * Emits the `#220` `profile_season_stats_computed` telemetry event on
 * every successful run AND on every cache-hit mount. The `cache_hit`
 * param distinguishes a real compute from a React Query cache hit; the
 * `source` param (#244) distinguishes `'materialized'` from `'live'`
 * compute pipelines. A cache hit reports `source: 'materialized'` with
 * zeroed counters since no Firestore read happened this render.
 *
 * @param {string | undefined} uid
 */
export function useUserSeasonStats(uid) {
  const { showDates, loading: showDatesLoading } = useShowCalendar();
  const { user: viewer } = useAuth();

  const trimmedUid = uid?.trim() || '';
  const showDatesKey = deriveShowDatesKey(showDates);
  const enabled = trimmedUid.length > 0 && !showDatesLoading;

  // Cheap derivation (one pass over ~30 dates + one comparison per date);
  // computed on every render, but only read inside the `queryFn` that
  // React Query gates on the `[uid, showDatesKey]` cache key.
  const latestFinalizedShow = deriveLatestFinalizedShow(showDates);

  // Captured by the queryFn on every actual compute, then read by the
  // post-success telemetry effect. A ref keeps the latest run's counters
  // in sync with the data we hand to the cache without triggering renders.
  const lastComputeTelemetryRef = useRef(
    /**
     * @type {{
     *   shows_checked: number,
     *   shows_played: number,
     *   collection_queries: number,
     *   elapsed_ms: number,
     *   source: 'materialized' | 'live',
     * } | null}
     */ (null)
  );

  const query = useQuery({
    queryKey: ['profile-season-stats', trimmedUid, showDatesKey],
    enabled,
    queryFn: async () => {
      const startedAt =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();
      /**
       * @type {{
       *   showsChecked: number,
       *   showsPlayed: number,
       *   collectionQueries: number,
       *   source: 'materialized' | 'live',
       * } | null}
       */
      let captured = null;
      try {
        const stats = await computeUserSeasonStats(trimmedUid, showDates, {
          latestFinalizedShow,
          onTelemetry: (t) => {
            captured = { ...t };
          },
        });
        return stats;
      } finally {
        const endedAt =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
        if (captured) {
          lastComputeTelemetryRef.current = {
            shows_checked: captured.showsChecked,
            shows_played: captured.showsPlayed,
            collection_queries: captured.collectionQueries,
            elapsed_ms: endedAt - startedAt,
            source: captured.source,
          };
        }
      }
    },
  });

  // Surface the load error in the same shape the previous useState scaffold
  // did so callers don't need to change.
  useEffect(() => {
    if (query.isError) {
      console.error('useUserSeasonStats error:', query.error);
    }
  }, [query.isError, query.error]);

  // One telemetry event per profile view. `isFetchedAfterMount` is the
  // documented signal for "did this query fetch since this consumer
  // mounted?" — false means we served data straight from the cache.
  const emittedForFetchKeyRef = useRef(/** @type {string | null} */ (null));
  useEffect(() => {
    if (!enabled || !query.isSuccess) return;

    const fetchKey = `${trimmedUid}:${showDatesKey}:${
      query.isFetchedAfterMount ? 'fresh' : 'cached'
    }`;
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
            elapsed_ms: 0,
            // Cache hits mean no Firestore read happened this render — the
            // source is effectively "materialized from cache." Keeps the
            // GA4 param shape stable so the dashboard doesn't need a
            // null-source bucket.
            source: /** @type {'materialized' | 'live'} */ ('materialized'),
          };

    emitProfileSeasonStatsTelemetry({
      ...computeTelemetry,
      self_view: Boolean(viewer?.uid && viewer.uid === trimmedUid),
      cache_hit: cacheHit,
    });
  }, [
    enabled,
    query.isSuccess,
    query.isFetchedAfterMount,
    trimmedUid,
    showDatesKey,
    viewer?.uid,
  ]);

  // Match the previous public shape exactly:
  //   - no uid → loading: false, empty stats, no error
  //   - showDates still loading → loading: true (matches old effect gate)
  //   - otherwise → reflect the React Query state
  if (!trimmedUid) {
    return {
      stats: { ...EMPTY_USER_SEASON_STATS },
      loading: false,
      error: null,
    };
  }

  const loading = showDatesLoading || query.isPending || query.isFetching;
  const stats = query.data ?? { ...EMPTY_USER_SEASON_STATS };
  const error = query.isError
    ? query.error instanceof Error
      ? query.error
      : new Error('Failed to load stats.')
    : null;

  return { stats, loading, error };
}
