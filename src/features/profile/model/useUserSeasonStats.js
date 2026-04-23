import { useEffect, useState } from 'react';

import { useAuth } from '../../auth';
import { useShowCalendar } from '../../show-calendar';
import {
  EMPTY_USER_SEASON_STATS,
  computeUserSeasonStats,
} from '../api/profileSeasonStats';
import { emitProfileSeasonStatsTelemetry } from './profileStatsTelemetry';

/**
 * Live-computed season totals for a user's public profile.
 *
 * - `totalPoints` / `shows` come from the user's own graded picks.
 * - `wins` = shows won overall (global high score across every graded pick
 *   for that show), not pool-scoped wins — a user who won 3 shows total is
 *   credited 3, regardless of how many pools they're in.
 *
 * Also emits the `#220` `profile_season_stats_computed` telemetry event on
 * each successful run so we can measure reads × views and decide if / when
 * to materialize the stats via `rollupScoresForShow`.
 *
 * @param {string | undefined} uid
 */
export function useUserSeasonStats(uid) {
  const { showDates, loading: showDatesLoading } = useShowCalendar();
  const { user: viewer } = useAuth();
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
      const startedAt =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();
      /** @type {{ showsChecked: number, showsPlayed: number, collectionQueries: number } | null} */
      let capturedTelemetry = null;
      try {
        const next = await computeUserSeasonStats(uid, showDates, {
          onTelemetry: (t) => {
            capturedTelemetry = { ...t };
          },
        });
        if (!cancelled) setStats(next);
      } catch (e) {
        console.error('useUserSeasonStats error:', e);
        if (!cancelled) {
          setStats({ ...EMPTY_USER_SEASON_STATS });
          setError(e instanceof Error ? e : new Error('Failed to load stats.'));
        }
      } finally {
        const endedAt =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
        if (!cancelled && capturedTelemetry) {
          emitProfileSeasonStatsTelemetry({
            shows_checked: capturedTelemetry.showsChecked,
            shows_played: capturedTelemetry.showsPlayed,
            collection_queries: capturedTelemetry.collectionQueries,
            elapsed_ms: endedAt - startedAt,
            self_view: Boolean(viewer?.uid && viewer.uid === uid),
          });
        }
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [uid, showDates, showDatesLoading, viewer?.uid]);

  return { stats, loading, error };
}
