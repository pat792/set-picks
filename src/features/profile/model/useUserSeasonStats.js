import { useEffect, useState } from 'react';

import { useShowCalendar } from '../../show-calendar';
import {
  EMPTY_USER_SEASON_STATS,
  computeUserSeasonStats,
} from '../api/profileSeasonStats';

/**
 * Live-computed season totals for a user's public profile.
 *
 * - `totalPoints` / `shows` come from the user's own graded picks.
 * - `wins` = shows won overall (global high score across every graded pick
 *   for that show), not pool-scoped wins — a user who won 3 shows total is
 *   credited 3, regardless of how many pools they're in.
 *
 * @param {string | undefined} uid
 */
export function useUserSeasonStats(uid) {
  const { showDates, loading: showDatesLoading } = useShowCalendar();
  const [stats, setStats] = useState({ ...EMPTY_USER_SEASON_STATS });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {Error | null} */ (null));

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!uid?.trim()) {
        setStats({ ...EMPTY_USER_SEASON_STATS });
        setLoading(false);
        setError(null);
        return;
      }
      if (showDatesLoading) return;

      setLoading(true);
      setError(null);
      try {
        const next = await computeUserSeasonStats(uid, showDates);
        if (!cancelled) setStats(next);
      } catch (e) {
        console.error('useUserSeasonStats error:', e);
        if (!cancelled) {
          setStats({ ...EMPTY_USER_SEASON_STATS });
          setError(e instanceof Error ? e : new Error('Failed to load stats.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [uid, showDates, showDatesLoading]);

  return { stats, loading, error };
}
