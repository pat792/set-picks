import { useEffect } from 'react';

import { ga4Event } from '../../../shared/lib/ga4';
import { getShowStatus } from '../../../shared/utils/timeLogic';

/**
 * Fires `view_leaderboard` when standings content is relevant for the selected show.
 */
export function useStandingsLeaderboardView(selectedDate, loading, showDates) {
  useEffect(() => {
    if (loading || !selectedDate) return;
    if (!Array.isArray(showDates) || showDates.length === 0) return;
    if (getShowStatus(selectedDate, showDates) === 'FUTURE') return;
    ga4Event('view_leaderboard', {
      context: 'standings',
      show_date: selectedDate,
    });
  }, [selectedDate, loading, showDates]);
}
