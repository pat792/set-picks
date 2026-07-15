import React from 'react';

import {
  StandingsShowOrPoolView,
  StandingsStickyChrome,
  StandingsTourView,
  useStandingsScreen,
} from '../../features/scoring';

export default function StandingsPage({ selectedDate, onSelectShowDate }) {
  const screen = useStandingsScreen(selectedDate, { onSelectShowDate });

  return (
    <div className="w-full">
      <StandingsStickyChrome
        view={screen.view}
        onChange={screen.setView}
        onOpenScoringRules={screen.openScoringRules}
        pinBelowDesktopDatePicker={screen.view !== 'tour'}
      />

      <div className="mt-5">
        {screen.view === 'tour' ? (
          <StandingsTourView
            tourName={screen.selectedTour?.tour}
            leaders={screen.tourLeaders}
            loading={screen.tourLoading}
            error={screen.tourError}
            hasCurrentTour={Boolean(screen.selectedTour)}
            selectableTours={screen.selectableTours}
            selectedTourKey={screen.selectedTour?.tour ?? null}
            onSelectTour={screen.setTourKey}
          />
        ) : (
          <StandingsShowOrPoolView screen={screen} />
        )}
      </div>
    </div>
  );
}
