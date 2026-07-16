import React from 'react';

import { InviteChooserSheet } from '../../features/invite';
import {
  StandingsChrome,
  StandingsShowOrPoolView,
  StandingsTourView,
  useStandingsScreen,
} from '../../features/scoring';

export default function StandingsPage({ selectedDate, onSelectShowDate }) {
  const screen = useStandingsScreen(selectedDate, { onSelectShowDate });
  const invite = screen.inviteChooser;

  return (
    <div className="w-full">
      <StandingsChrome
        view={screen.view}
        onChange={screen.setView}
        onOpenScoringRules={screen.openScoringRules}
        onOpenInvite={invite.openChooser}
      />

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
