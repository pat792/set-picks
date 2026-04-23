import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

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
 * Live-computed season totals for a user's public profile.
 *
 * - `totalPoints` / `shows` come from the user's own graded picks.
 * - `wins` = shows won overall (global high score across every graded pick
 *   for that show), not pool-scoped wins — a user who won 3 shows total is
 *   credited 3, regardless of how many pools they're in.
 *
 * Wrapped with React Query in #243 so back-navigation within the session
 * reuses cached stats per `(uid, showDatesKey)` instead of re-issuing the
 * `|showDates|` point reads + per-show Wins queries on every mount.
 *
 * Also emits the `#220` `profile_season_stats_computed` telemetry event on
 * every successful run AND on every cache-hit mount; the new `cache_hit`
 * param distinguishes the two so we can measure cache effectiveness without
 * losing reads-per-view accuracy.
 *
 * @param {string | undefined} uid
 */
export function useUserSeasonStats(uid) {
  const { showDates, loading: showDatesLoading } = useShowCalendar();
  const { user: viewer } = useAuth();

  const trimmedUid = uid?.trim() || '';
  const showDatesKey = deriveShowDatesKey(showDates);
  const enabled = trimmedUid.length > 0 && !showDatesLoading;

  // Captured by the queryFn on every actual compute, then read by the
  // post-success telemetry effect. A ref keeps the latest run's counters
  // in sync with the data we hand to the cache without triggering renders.
  const lastComputeTelemetryRef = useRef(
    /** @type {{ shows_checked: number, shows_played: number, collection_queries: number, elapsed_ms: number } | null} */ (
      null
    )
  );

  const query = useQuery({
    queryKey: ['profile-season-stats', trimmedUid, showDatesKey],
    enabled,
    queryFn: async () => {
      const startedAt =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();
      /** @type {{ showsChecked: number, showsPlayed: number, collectionQueries: number } | null} */
      let captured = null;
      try {
        const stats = await computeUserSeasonStats(trimmedUid, showDates, {
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
        : { shows_checked: 0, shows_played: 0, collection_queries: 0, elapsed_ms: 0 };

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
