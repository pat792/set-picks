import React, { useEffect } from 'react';

import { useFeatureSpotlight } from '../../features/feature-discovery';
import { useScoringRulesModal, useStandingsTourSelection } from '../../features/scoring';
import { TourStatsView, useTourStatsScreen } from '../../features/tour-stats';
import { useShowCalendar } from '../../features/show-calendar';
import { ga4Event } from '../../shared/lib/ga4';

/**
 * Stats cluster — Global Stats (`/dashboard/stats/global`).
 * Private tour explorer (unique songs, frequency, bustouts, self overlay) from #555.
 */
export default function GlobalStatsPage() {
  const { showDatesByTour, loading: calendarLoading } = useShowCalendar();
  const { selectedTour } = useStandingsTourSelection(showDatesByTour);
  const screen = useTourStatsScreen({
    selectedTour,
    calendarLoading,
  });
  const { openScoringRules: openScoringRulesModal } = useScoringRulesModal();
  const tourStatsSpotlight = useFeatureSpotlight('tour-stats', {
    trackImpression: false,
  });

  useEffect(() => {
    tourStatsSpotlight.markSeen();
  }, [tourStatsSpotlight.markSeen]);

  const openScoringRules = () => {
    ga4Event('scoring_rules_opened', { surface: 'tour-stats' });
    openScoringRulesModal();
  };

  return (
    <div className="w-full">
      <TourStatsView {...screen} onOpenScoringRules={openScoringRules} />
    </div>
  );
}
