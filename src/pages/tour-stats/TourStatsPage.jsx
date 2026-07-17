import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { useFeatureSpotlight } from '../../features/feature-discovery';
import {
  StandingsMobileFixedChrome,
  StandingsStickyChrome,
  useScoringRulesModal,
  useStandingsTourSelection,
  useStandingsViewChange,
} from '../../features/scoring';
import { TourStatsView, useTourStatsScreen } from '../../features/tour-stats';
import { useShowCalendar } from '../../features/show-calendar';
import { useDashboardMobileChromePortal } from '../../shared/hooks/useDashboardMobileChromePortal';
import { ga4Event } from '../../shared/lib/ga4';

/**
 * Dashboard Tour stats explorer (#555) — peer Standings view (Stats tab).
 * Tour scope uses the same chrome picker + `?tour=` as Standings → Tour.
 */
export default function TourStatsPage() {
  const { showDatesByTour, loading: calendarLoading } = useShowCalendar();
  const { selectedTour, selectableTours } =
    useStandingsTourSelection(showDatesByTour);
  const screen = useTourStatsScreen({
    selectedTour,
    calendarLoading,
  });
  const setView = useStandingsViewChange({ view: 'stats' });
  const { openScoringRules: openScoringRulesModal } = useScoringRulesModal();
  const mobileChromeRoot = useDashboardMobileChromePortal();
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

  const mobileFixedChrome = (
    <StandingsMobileFixedChrome
      view="stats"
      onChange={setView}
      onOpenScoringRules={openScoringRules}
    />
  );

  return (
    <div className="w-full">
      {mobileChromeRoot
        ? createPortal(mobileFixedChrome, mobileChromeRoot)
        : null}

      <StandingsStickyChrome
        view="stats"
        onChange={setView}
        onOpenScoringRules={openScoringRules}
        pinBelowDesktopDatePicker={selectableTours.length > 0}
      />

      <div className="mt-4 md:mt-5">
        <TourStatsView {...screen} onOpenScoringRules={openScoringRules} />
      </div>
    </div>
  );
}
