import React from 'react';
import { Scale } from 'lucide-react';

import { InviteChooserSheet, InviteChooserTrigger } from '../../features/invite';
import {
  StandingsShowOrPoolView,
  StandingsTourView,
  StandingsViewToggle,
  useStandingsScreen,
} from '../../features/scoring';

export default function StandingsPage({ selectedDate, onSelectShowDate }) {
  const screen = useStandingsScreen(selectedDate, { onSelectShowDate });
  const invite = screen.inviteChooser;

  return (
    <div className="w-full">
      {/* Invite + Scoring rules sit above the primary IA toggle so neither
          competes with Show / Tour / Pools. Sticky chrome stays on staging. */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <InviteChooserTrigger onClick={invite.openChooser} />
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

      <InviteChooserSheet
        open={invite.open}
        onClose={invite.closeChooser}
        step={invite.step}
        inviterHandle={invite.inviterHandle}
        inviteablePools={invite.inviteablePools}
        selectedPoolId={invite.selectedPoolId}
        onSelectPoolId={invite.setSelectedPoolId}
        selectedPool={invite.selectedPool}
        sharing={invite.sharing}
        onShareSiteInvite={invite.shareSiteInvite}
        onSharePoolInvite={invite.sharePoolInvite}
        onGoToPoolStep={invite.goToPoolStep}
        onBackToChoose={invite.backToChoose}
      />

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
  );
}
