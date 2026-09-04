import React from 'react';

import { ProfileSelfStatsPanel } from '../../profile';
import { useStandingsTourSelection } from '../../scoring';
import { TourStatsSelfOverlay, useTourStatsScreen } from '../../tour-stats';
import { useShowCalendar } from '../../show-calendar';
import StatsExpandableSection from './StatsExpandableSection';

/**
 * Personal Stats stack (#1004): all-time (tour-agnostic) above a tour rollup.
 * Career never unmounts; `?tour=` restamps only the overlay block.
 *
 * @param {{ user?: { uid?: string } | null }} props
 */
export default function PersonalStatsScreen({ user }) {
  const { showDatesByTour, loading: calendarLoading } = useShowCalendar();
  const { selectedTour } = useStandingsTourSelection(showDatesByTour);
  const screen = useTourStatsScreen({
    selectedTour,
    calendarLoading,
    includeSelfOverlay: true,
  });

  return (
    <div className="space-y-4">
      <StatsExpandableSection
        title="All-time"
        hint="Career stats across every show you've played. The tour picker does not change this block."
        defaultOpen
      >
        <ProfileSelfStatsPanel uid={user?.uid} />
      </StatsExpandableSection>

      <StatsExpandableSection
        title="This tour"
        hint="Your picks for the tour selected in the picker above."
        defaultOpen
      >
        <TourStatsSelfOverlay
          overlay={screen.overlay}
          overlayLoading={screen.overlayLoading}
          calendarLoading={screen.calendarLoading}
          setlistLoading={screen.setlistLoading}
          hasTour={screen.hasTour}
          setlistError={screen.setlistError}
          showEmpty
        />
      </StatsExpandableSection>
    </div>
  );
}
