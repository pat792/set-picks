import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { resolveCurrentTour } from '../../scoring';
import { useShowCalendar } from '../../show-calendar';
import { todayYmd } from '../../../shared/utils/dateUtils';
import {
  GAME_LAUNCH_SHOW_DATE,
  floorShowsAtGameLaunch,
} from '../../../shared/config/gameLaunch';
import { loadPoolStandings } from '../api/poolStandings';
import { emitPoolStandingsTelemetry } from './poolStandingsTelemetry';

/** @typedef {'all-time' | 'tour'} PoolStandingsScope */

/**
 * Compute the most-recent finalized show date the client is aware of —
 * the max calendar date on or before today, after flooring at
 * {@link GAME_LAUNCH_SHOW_DATE}. Mirrors the heuristic in
 * `useUserSeasonStats` so the materialized short-circuit (#244) fires
 * when `users.{uid}.seasonStatsThroughShow >= latestFinalizedShow`.
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
    if (d < GAME_LAUNCH_SHOW_DATE) continue;
    if (!latest || d > latest) latest = d;
  }
  return latest;
}

/**
 * Pool-scoped standings (#148) with the All-time / Tour toggle.
 *
 * #254 perf rewrite: replaces the historical
 * `members × showDates` Firestore fan-out (`computePoolSeasonTotalsByUser`)
 * with the #244 materialized read path — one `users/{uid}` point read
 * per member, with a per-member live-compute fallback for stale
 * snapshots. Read cost on the hot path collapses from `O(N × S)` to
 * `O(N)` (where N = pool members, S = `showDates.length`). React Query
 * (#243) caches the result keyed on `(poolId, scope, tourKey,
 * memberKey, latestFinalizedShow)` so back-nav within the session
 * issues zero Firestore reads.
 *
 * Wins follow the same shared `reduceShowWinners` rule the profile uses
 * — the materialized path returns the global-max wins persisted in
 * `users/{uid}.wins` (or `seasonStats.{tourKey}.wins`). See
 * `readMaterializedPoolStandings`'s "wins semantic note" for why this is
 * a near-zero behavior change in practice.
 *
 * Emits one `pool_standings_computed` telemetry event per view —
 * compute and React-Query cache hits both — so we can verify the read
 * win post-rollout.
 *
 * @param {string | undefined} poolId
 * @param {{ members?: string[], id?: string } | null} pool
 * @param {Array<{ id: string, handle?: string } & Record<string, unknown>>} memberProfiles
 */
export function usePoolStandingsSection(poolId, pool, memberProfiles) {
  const { showDates, showDatesByTour } = useShowCalendar();

  const currentTour = useMemo(
    () => resolveCurrentTour(null, todayYmd(), showDatesByTour),
    [showDatesByTour]
  );

  const [scope, setScope] = useState(/** @type {PoolStandingsScope} */ ('all-time'));

  const tourKey = scope === 'tour' && currentTour ? currentTour.tour : null;

  const effectiveShowDates = useMemo(() => {
    if (scope === 'tour' && currentTour) {
      return floorShowsAtGameLaunch(
        currentTour.shows.map((s) => ({ date: s.date }))
      );
    }
    return floorShowsAtGameLaunch(showDates);
  }, [scope, currentTour, showDates]);

  const memberIds = useMemo(
    () => (Array.isArray(pool?.members) ? pool.members.filter(Boolean) : []),
    [pool?.members]
  );
  const memberKey = useMemo(
    () => [...memberIds].sort().join('|'),
    [memberIds]
  );

  const latestFinalizedShow = useMemo(
    () => deriveLatestFinalizedShow(showDates),
    [showDates]
  );

  const trimmedPoolId = poolId?.trim() || '';
  const enabled =
    trimmedPoolId.length > 0 && Boolean(pool) && memberIds.length > 0;

  // Captured by the queryFn on every actual compute, then read by the
  // post-success telemetry effect. A ref keeps the latest run's counters
  // in sync with the data we hand to the cache without triggering renders.
  const lastComputeTelemetryRef = useRef(
    /**
     * @type {{
     *   member_count: number,
     *   members_materialized: number,
     *   members_live_fallback: number,
     *   elapsed_ms: number,
     *   scope: 'all-time' | 'tour',
     * } | null}
     */ (null)
  );

  const query = useQuery({
    queryKey: [
      'pool-standings',
      trimmedPoolId,
      scope,
      tourKey || '',
      memberKey,
      latestFinalizedShow || '',
    ],
    enabled,
    queryFn: async () => {
      const startedAt =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();
      /**
       * @type {{
       *   memberCount: number,
       *   membersMaterialized: number,
       *   membersLiveFallback: number,
       *   scope: 'all-time' | 'tour',
       * } | null}
       */
      let captured = null;
      try {
        const totals = await loadPoolStandings(
          trimmedPoolId,
          memberIds,
          effectiveShowDates,
          {
            latestFinalizedShow,
            tourKey,
            onTelemetry: (t) => {
              captured = { ...t };
            },
          }
        );
        return totals;
      } finally {
        const endedAt =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
        if (captured) {
          lastComputeTelemetryRef.current = {
            member_count: captured.memberCount,
            members_materialized: captured.membersMaterialized,
            members_live_fallback: captured.membersLiveFallback,
            elapsed_ms: endedAt - startedAt,
            scope: captured.scope,
          };
        }
      }
    },
  });

  useEffect(() => {
    if (query.isError) {
      console.error('Pool standings load error:', query.error);
    }
  }, [query.isError, query.error]);

  // One telemetry event per view. `isFetchedAfterMount` is the documented
  // signal for "did this query fetch since this consumer mounted?" —
  // false means we served data straight from the cache.
  const emittedForFetchKeyRef = useRef(/** @type {string | null} */ (null));
  useEffect(() => {
    if (!enabled || !query.isSuccess) return;

    const fetchKey = `${trimmedPoolId}:${scope}:${tourKey || ''}:${memberKey}:${
      query.isFetchedAfterMount ? 'fresh' : 'cached'
    }`;
    if (emittedForFetchKeyRef.current === fetchKey) return;
    emittedForFetchKeyRef.current = fetchKey;

    const cacheHit = !query.isFetchedAfterMount;
    const computeTelemetry =
      !cacheHit && lastComputeTelemetryRef.current
        ? lastComputeTelemetryRef.current
        : {
            member_count: memberIds.length,
            members_materialized: 0,
            members_live_fallback: 0,
            elapsed_ms: 0,
            scope: /** @type {'all-time' | 'tour'} */ (scope),
          };

    emitPoolStandingsTelemetry({
      ...computeTelemetry,
      cache_hit: cacheHit,
    });
  }, [
    enabled,
    query.isSuccess,
    query.isFetchedAfterMount,
    trimmedPoolId,
    scope,
    tourKey,
    memberKey,
    memberIds.length,
  ]);

  const totalsByUser = query.data ?? null;

  const leaderboardMembers = useMemo(() => {
    const rows = (memberProfiles || []).map((m) => {
      const t = totalsByUser?.get(m.id) || {
        totalScore: 0,
        showsPlayed: 0,
        wins: 0,
      };
      return {
        ...m,
        totalPoints: t.totalScore,
        wins: t.wins,
        showsPlayed: t.showsPlayed,
      };
    });
    rows.sort(
      (a, b) =>
        (typeof b.totalPoints === 'number' ? b.totalPoints : 0) -
        (typeof a.totalPoints === 'number' ? a.totalPoints : 0)
    );
    return rows;
  }, [memberProfiles, totalsByUser]);

  // Public shape stays identical to the pre-#254 hook so the page and UI
  // consumers don't need updates.
  const loading =
    enabled && (query.isPending || query.isFetching) && !query.isSuccess;
  const error = query.isError
    ? query.error instanceof Error
      ? query.error
      : new Error('Failed to load pool totals.')
    : null;

  return {
    scope,
    setScope,
    tourName: currentTour?.tour ?? null,
    tourAvailable: Boolean(currentTour),
    leaderboardMembers,
    loading,
    error,
    reload: query.refetch,
  };
}
