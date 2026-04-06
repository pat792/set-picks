import { useCallback, useEffect, useMemo, useState } from 'react';

import { todayYmd } from '../../../shared/utils/dateUtils.js';
import {
  computePoolSeasonTotalsByUser,
  pastScheduledShowDates,
} from '../api/poolFirestore';

/**
 * Pool-scoped season totals from `picks` (graded scores only), merged with member profiles.
 * @param {string | undefined} poolId
 * @param {{ members?: string[], id?: string } | null} pool
 * @param {Array<{ id: string, handle?: string } & Record<string, unknown>>} memberProfiles
 */
export function usePoolSeasonStandings(poolId, pool, memberProfiles) {
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
      const next = await computePoolSeasonTotalsByUser(pid, memberIds);
      setTotalsByUser(next);
    } catch (e) {
      console.error('Pool season standings load error:', e);
      setError(e instanceof Error ? e : new Error('Failed to load pool totals.'));
      setTotalsByUser(new Map());
    } finally {
      setLoading(false);
    }
  }, [poolId, pool, memberIds]);

  useEffect(() => {
    load();
  }, [load]);

  const totalShowsInPoolSeason = useMemo(
    () => pastScheduledShowDates(todayYmd()).length,
    []
  );

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
        showsParticipatedIn: t.showsPlayed,
        totalShowsInPoolSeason,
      };
    });
    rows.sort(
      (a, b) =>
        (typeof b.totalPoints === 'number' ? b.totalPoints : 0) -
        (typeof a.totalPoints === 'number' ? a.totalPoints : 0)
    );
    return rows;
  }, [memberProfiles, totalsByUser, totalShowsInPoolSeason]);

  return {
    leaderboardMembers,
    loading,
    error,
    totalShowsInPoolSeason,
    reload: load,
  };
}
