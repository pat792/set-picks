import React from 'react';
import { Loader2 } from 'lucide-react';

import { useStandingsTourSelection } from '../../scoring';
import { useShowCalendar } from '../../show-calendar';
import { GLOBAL_LEADERBOARD_BOARDS } from '../model/globalLeaderboardRanking';
import { useGlobalStatsScreen } from '../model/useGlobalStatsScreen';
import GlobalLeaderboardBoard from './GlobalLeaderboardBoard';
import StatsExpandableSection from './StatsExpandableSection';

/**
 * Global Stats (#1004 Phase 2): expandable All-time + This tour boards.
 *
 * @param {{ user?: { uid?: string } | null }} props
 */
export default function GlobalStatsScreen({ user }) {
  const { showDatesByTour, loading: calendarLoading } = useShowCalendar();
  const { selectedTour } = useStandingsTourSelection(showDatesByTour);
  const screen = useGlobalStatsScreen({ user, selectedTour });

  return (
    <div className="space-y-4">
      {screen.error ? (
        <p className="rounded-xl border border-red-900/50 bg-red-900/20 px-3.5 py-3 text-sm text-red-200">
          Couldn&apos;t load global rankings. Try refreshing.
        </p>
      ) : null}
      <StatsExpandableSection
        title="All-time"
        hint="Career leaderboards across every graded show. The tour picker does not change this block. Ratio boards require at least 3 shows."
        defaultOpen
      >
        {screen.loading && !screen.hasAllTimeDoc ? (
          <Loader2
            className="h-5 w-5 animate-spin text-brand-primary"
            aria-label="Loading all-time leaderboards"
          />
        ) : (
          <div className="space-y-5">
            {GLOBAL_LEADERBOARD_BOARDS.map((board) => (
              <GlobalLeaderboardBoard
                key={`allTime-${board.key}`}
                title={board.title}
                boardKey={board.key}
                rows={screen.allTimeBoards[board.key]}
              />
            ))}
          </div>
        )}
      </StatsExpandableSection>

      <StatsExpandableSection
        title="This tour"
        hint={`Leaderboards for ${screen.tourName}. Restamps with the tour picker. Ratio boards require at least 3 shows in this tour.`}
        defaultOpen
      >
        {calendarLoading || (screen.loading && !screen.hasTourDoc) ? (
          <Loader2
            className="h-5 w-5 animate-spin text-brand-primary"
            aria-label="Loading tour leaderboards"
          />
        ) : (
          <div className="space-y-5">
            {GLOBAL_LEADERBOARD_BOARDS.map((board) => (
              <GlobalLeaderboardBoard
                key={`tour-${board.key}`}
                title={board.title}
                boardKey={board.key}
                rows={screen.tourBoards[board.key]}
              />
            ))}
          </div>
        )}
      </StatsExpandableSection>
    </div>
  );
}
