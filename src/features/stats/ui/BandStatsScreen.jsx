import React, { useEffect } from 'react';

import { useFeatureSpotlight } from '../../feature-discovery';
import { useScoringRulesModal, useStandingsTourSelection } from '../../scoring';
import { TourStatsView, useTourStatsScreen } from '../../tour-stats';
import { useShowCalendar } from '../../show-calendar';
import { ga4Event } from '../../../shared/lib/ga4';

/**
 * Band Stats (#1004) — #555 song explorer (frequency / bustouts / high gaps).
 * Self overlay lives on Personal. Public `/tour-stats` stays the marketing twin.
 */
export default function BandStatsScreen() {
  const { showDatesByTour, loading: calendarLoading } = useShowCalendar();
  const { selectedTour } = useStandingsTourSelection(showDatesByTour);
  const screen = useTourStatsScreen({
    selectedTour,
    calendarLoading,
    includeSelfOverlay: false,
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
      <TourStatsView
        {...screen}
        showSelfOverlay={false}
        onOpenScoringRules={openScoringRules}
      />
    </div>
  );
}
