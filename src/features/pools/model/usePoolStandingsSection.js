import { useCallback, useEffect, useMemo, useState } from 'react';

import { resolveCurrentTour } from '../../scoring';
import { useShowCalendar } from '../../show-calendar';
import { todayYmd } from '../../../shared/utils/dateUtils';
import { computePoolSeasonTotalsByUser } from '../api/poolFirestore';

/** @typedef {'all-time' | 'tour'} PoolStandingsScope */

/**
 * Pool-scoped standings (#148) with the All-time / Tour toggle.
 *
 * All-time scope aggregates across every show in `showDates` — identical
 * behavior to the legacy "Season totals" view (pre-#148). Tour scope
 * filters the show list down to the current tour from
 * `show_calendar.showDatesByTour` (authoritative) via
 * {@link resolveCurrentTour}.
 *
 * `Wins` math is identical in both scopes and is the same rule used by
 * Profile `Wins` (#217), Standings #218, and global Tour standings (#219):
 * global max per show, ties share, `max === 0 → skip`. That math lives in
 * `computePoolSeasonTotalsByUser` which consumes
 * `pickCountsTowardSeason` from `shared/utils/showAggregation`.
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

  const effectiveShowDates = useMemo(() => {
    if (scope === 'tour' && currentTour) {
      return currentTour.shows.map((s) => ({ date: s.date }));
    }
    return showDates;
  }, [scope, currentTour, showDates]);

  const [totalsByUser, setTotalsByUser] = useState(
    /** @type {Map<string, { totalScore: number, showsPlayed: number, wins: number }>} */ (
      new Map()
    )
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {Error | null} */ (null));

  const memberIds = useMemo(
    () => (Array.isArray(pool?.members) ? pool.members.filter(Boolean) : []),
    [pool?.members]
  );

  const load = useCallback(async () => {
    const pid = poolId?.trim();
    if (!pid || !pool || memberIds.length === 0) {
      setTotalsByUser(new Map());
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await computePoolSeasonTotalsByUser(
        pid,
        memberIds,
        effectiveShowDates
      );
      setTotalsByUser(next);
    } catch (e) {
      console.error('Pool standings load error:', e);
      setError(e instanceof Error ? e : new Error('Failed to load pool totals.'));
      setTotalsByUser(new Map());
    } finally {
      setLoading(false);
    }
  }, [poolId, pool, memberIds, effectiveShowDates]);

  useEffect(() => {
    load();
  }, [load]);

  const leaderboardMembers = useMemo(() => {
    const rows = (memberProfiles || []).map((m) => {
      const t = totalsByUser.get(m.id) || {
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

  return {
    scope,
    setScope,
    tourName: currentTour?.tour ?? null,
    tourAvailable: Boolean(currentTour),
    leaderboardMembers,
    loading,
    error,
    reload: load,
  };
}
