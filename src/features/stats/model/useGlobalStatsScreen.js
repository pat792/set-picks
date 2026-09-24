import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../../auth';
import {
  fetchGlobalLeaderboardDoc,
  fetchViewerUserDoc,
} from '../api/globalLeaderboardsApi';
import {
  GLOBAL_LEADERBOARD_MIN_SHOWS,
  mergeAllBoards,
  viewerMetricsFromUserDoc,
} from './globalLeaderboardRanking';

/**
 * Global Stats boards (#1004 Phase 2).
 * Reads aggregate docs + the signed-in user doc only.
 *
 * @param {{
 *   user?: { uid?: string } | null,
 *   selectedTour?: { tour?: string } | null,
 * }} [opts]
 */
export function useGlobalStatsScreen({ user, selectedTour } = {}) {
  const { userProfile, loading: authLoading } = useAuth();
  const uid = user?.uid?.trim() || '';
  const tourKey =
    typeof selectedTour?.tour === 'string' && selectedTour.tour.trim()
      ? selectedTour.tour.trim()
      : '';

  const allTimeQuery = useQuery({
    queryKey: ['global-stats-leaderboards', 'allTime'],
    queryFn: () => fetchGlobalLeaderboardDoc('allTime'),
  });

  const tourQuery = useQuery({
    queryKey: ['global-stats-leaderboards', 'tour', tourKey],
    queryFn: () => fetchGlobalLeaderboardDoc({ tourKey }),
    enabled: Boolean(tourKey),
  });

  const viewerQuery = useQuery({
    queryKey: ['global-stats-leaderboards', 'viewer', uid],
    queryFn: () => fetchViewerUserDoc(uid),
    enabled: Boolean(uid) && !authLoading && !userProfile,
  });

  const viewerDoc = userProfile || viewerQuery.data || null;
  const allTimeViewer = viewerMetricsFromUserDoc(viewerDoc, {
    uid,
    scope: 'allTime',
  });
  const tourViewer = viewerMetricsFromUserDoc(viewerDoc, {
    uid,
    scope: 'tour',
    tourKey,
  });

  return {
    tourKey,
    tourName: tourKey || 'This tour',
    minShows: GLOBAL_LEADERBOARD_MIN_SHOWS,
    allTimeBoards: mergeAllBoards(allTimeQuery.data, allTimeViewer),
    tourBoards: mergeAllBoards(tourQuery.data, tourViewer),
    loading:
      allTimeQuery.isLoading ||
      (Boolean(tourKey) && tourQuery.isLoading) ||
      (Boolean(uid) && authLoading && !userProfile && viewerQuery.isLoading),
    error: allTimeQuery.error || tourQuery.error || viewerQuery.error || null,
    hasAllTimeDoc: Boolean(allTimeQuery.data),
    hasTourDoc: Boolean(tourQuery.data),
  };
}
