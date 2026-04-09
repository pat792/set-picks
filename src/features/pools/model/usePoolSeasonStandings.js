import { useCallback, useEffect, useMemo, useState } from 'react';

import { useShowCalendar } from '../../show-calendar';
import { computePoolSeasonTotalsByUser } from '../api/poolFirestore';

/**
 * Pool-scoped season totals from `picks` (finalize + rollup only), merged with member profiles.
 * @param {string | undefined} poolId
 * @param {{ members?: string[], id?: string } | null} pool
 * @param {Array<{ id: string, handle?: string } & Record<string, unknown>>} memberProfiles
 */
export function usePoolSeasonStandings(poolId, pool, memberProfiles) {
  const { showDates } = useShowCalendar();
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
      const next = await computePoolSeasonTotalsByUser(pid, memberIds, showDates);
      setTotalsByUser(next);
    } catch (e) {
      console.error('Pool season standings load error:', e);
      setError(e instanceof Error ? e : new Error('Failed to load pool totals.'));
      setTotalsByUser(new Map());
    } finally {
      setLoading(false);
    }
  }, [poolId, pool, memberIds, showDates]);

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
    leaderboardMembers,
    loading,
    error,
    reload: load,
  };
}
