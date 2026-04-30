import React from 'react';
import { Scale } from 'lucide-react';

import {
  StandingsShowOrPoolView,
  StandingsTourView,
  StandingsViewToggle,
  useStandingsScreen,
} from '../../features/scoring';

export default function StandingsPage({ selectedDate, onSelectShowDate }) {
  const screen = useStandingsScreen(selectedDate, { onSelectShowDate });

  return (
    <div className="w-full">
      {/* Scoring rules: sits above the primary IA toggle per #255 — "top-right,
          below the 2nd header" (layout H1) — so it reads as utility chrome,
          not competition with the three-way view switch. */}
      <div className="mb-2 flex items-center justify-end">
        <button
          type="button"
          onClick={screen.openScoringRules}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-content-secondary transition-colors hover:bg-surface-panel hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        >
          <Scale className="h-3.5 w-3.5" aria-hidden />
          Scoring rules
        </button>
      </div>

      <StandingsViewToggle view={screen.view} onChange={screen.setView} />

      {screen.view === 'tour' ? (
        <StandingsTourView
          tourName={screen.currentTour?.tour}
          leaders={screen.tourLeaders}
          loading={screen.tourLoading}
          error={screen.tourError}
          hasCurrentTour={Boolean(screen.currentTour)}
        />
      ) : (
        <StandingsShowOrPoolView screen={screen} />
      )}
    </div>
  );
}
