import { useEffect } from 'react';

import { ga4Event } from '../../../shared/lib/ga4';
import { getShowStatus } from '../../../shared/utils/timeLogic';

/**
 * Fires `view_leaderboard` when standings content is relevant for the selected show.
 */
export function useStandingsLeaderboardView(selectedDate, loading) {
  useEffect(() => {
    if (loading || !selectedDate) return;
    if (getShowStatus(selectedDate) === 'FUTURE') return;
    ga4Event('view_leaderboard', {
      context: 'standings',
      show_date: selectedDate,
    });
  }, [selectedDate, loading]);
}
