import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExternalLink, Inbox, Loader2, Music, Scale } from 'lucide-react';

import { useAuth } from '../../features/auth';
import { useUserPools } from '../../features/pools';
import {
  Leaderboard,
  StandingsBannerWaitingSetlist,
  StandingsFilterTabs,
  useDisplayedPicks,
  useStandings,
  useStandingsLeaderboardView,
  ScoringRulesModal,
} from '../../features/scoring';
import { getShowStatus } from '../../shared/utils/timeLogic.js';
import Card from '../../shared/ui/Card';
import GhostPill from '../../shared/ui/GhostPill';
import PageTitle from '../../shared/ui/PageTitle';

export default function StandingsPage({ selectedDate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const targetPoolId =
    typeof location.state?.targetPoolId === 'string'
      ? location.state.targetPoolId.trim()
      : '';

  const { user } = useAuth();
  const { pools: userPools } = useUserPools(user?.uid);
  const { picks, actualSetlist, loading } = useStandings(selectedDate);
  const { displayedPicks, activeFilter, setActiveFilter, filterOptions } = useDisplayedPicks(
    picks,
    user,
    userPools,
    targetPoolId || undefined
  );

  const showStatus = getShowStatus(selectedDate);
  const [scoringRulesOpen, setScoringRulesOpen] = useState(false);

  useStandingsLeaderboardView(selectedDate, loading);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 mt-20 text-emerald-400 font-bold">
        <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
        <p>Loading Standings for {selectedDate}...</p>
      </div>
    );
  }

  if (showStatus === 'FUTURE') {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex justify-end px-2 mb-4">
        <GhostPill icon={Scale} onClick={() => setScoringRulesOpen(true)}>
          Scoring Rules
        </GhostPill>
      </div>
      <ScoringRulesModal open={scoringRulesOpen} onClose={() => setScoringRulesOpen(false)} />

      <StandingsFilterTabs
        activeFilter={activeFilter}
        filterOptions={filterOptions}
        onTabChange={setActiveFilter}
      />

      {!actualSetlist && picks.length > 0 ? <StandingsBannerWaitingSetlist /> : null}

      {displayedPicks.length === 0 ? (
        <Card
          variant="default"
          padding="lg"
          className="mt-12 flex flex-col items-center justify-center text-center"
        >
          {showStatus === 'PAST' ? (
            <>
              <Inbox className="mb-4 h-14 w-14 text-slate-500" strokeWidth={1.5} aria-hidden />
              <PageTitle as="h3" variant="section" className="mb-2">
                No picks for this show
              </PageTitle>
              <p className="text-slate-400 font-bold max-w-sm">
                {activeFilter === 'global'
                  ? 'Nobody submitted picks for this date.'
                  : 'None of your friends in this pool submitted picks for this date.'}
              </p>
            </>
          ) : (
            <>
              <Music className="mb-4 h-14 w-14 text-emerald-400/80" strokeWidth={1.5} aria-hidden />
              <PageTitle as="h3" variant="section" className="mb-2">
                NO PICKS YET
              </PageTitle>
              <p className="text-slate-400 font-bold max-w-sm">
                {activeFilter === 'global'
                  ? "Be the first to lock in your picks for tonight's show!"
                  : 'None of your friends in this pool have made picks yet!'}
              </p>
            </>
          )}
        </Card>
      ) : (
        <Leaderboard
          poolPicks={displayedPicks}
          actualSetlist={actualSetlist}
          title={activeFilter === 'global' ? 'Global Leaderboard' : 'Pool Leaderboard'}
          headerEnd={
            activeFilter !== 'global' ? (
              <GhostPill
                type="button"
                onClick={() => navigate(`/dashboard/pool/${activeFilter}`)}
                className="text-xs"
              >
                Go to Pool Hub
                <ExternalLink className="w-3.5 h-3.5 ml-1 shrink-0" aria-hidden />
              </GhostPill>
            ) : null
          }
        />
      )}
    </div>
  );
}
