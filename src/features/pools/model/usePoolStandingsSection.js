import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { resolveCurrentTour } from '../../scoring';
import { useShowCalendar } from '../../show-calendar';
import { todayYmd } from '../../../shared/utils/dateUtils';
import { floorShowsAtGameLaunch } from '../../../shared/config/gameLaunch';
import { loadPoolStandings } from '../api/poolStandings';
import { emitPoolStandingsTelemetry } from './poolStandingsTelemetry';

/** @typedef {'all-time' | 'tour'} PoolStandingsScope */

/**
 * Pool-scoped standings (#148) with the All-time / Tour toggle.
 *
 * #254 perf rewrite (round 3): the original attempt routed standings
 * through the #244 materialized `users/{uid}` aggregates, but those are
 * **global** sums — they cannot honor `pickDataCountsForPool` (per-pool
 * inclusion gate). That regression shipped to staging and produced
 * incomplete numbers for multiple users; round 2 reverted to the
 * per-pool live compute. Round 3 keeps the pool-scoped points/shows
 * (correctness fix) and aligns the **wins** column with the same
 * global "winner of the night" rule used by Standings #218, Profile
 * #217, and Tour standings #219 — a user should see the same wins
 * count for themselves on every surface.
 *
 * Perf wins kept from the original PR:
 *   - React Query (#243) caches the result keyed on `(poolId, scope,
 *     tourKey, memberKey)` so back-nav within the session issues zero
 *     Firestore reads.
 *   - `effectiveShowDates` is floored at `GAME_LAUNCH_SHOW_DATE` so we
 *     never iterate pre-launch upstream tour dates from the
 *     `show_calendar` collection (#160). For all-time scope this is the
 *     full eligible season; for tour scope the floor is a no-op (current
 *     tour is post-launch by definition).
 *
 * Pool-scoped materialization (per-pool aggregates persisted on
 * `pools/{poolId}/standings/{uid}` or similar) is filed as the safe
 * follow-up — it requires server-side fan-in on rollup that respects
 * `pickDataCountsForPool`.
 *
 * Emits one `pool_standings_computed` telemetry event per view (compute
 * and React Query cache hits both) so we can monitor read-cost trends.
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
  const showDatesKey = useMemo(
    () => effectiveShowDates.map((s) => s.date).join('|'),
    [effectiveShowDates]
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
     *   shows_scanned: number,
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
      showDatesKey,
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
       *   showsScanned: number,
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
            scope: tourKey ? 'tour' : 'all-time',
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
            shows_scanned: captured.showsScanned,
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
            shows_scanned: 0,
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
