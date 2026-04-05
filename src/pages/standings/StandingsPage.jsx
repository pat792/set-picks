import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Inbox, Loader2, Music } from 'lucide-react';

import { useAuth } from '../../features/auth';
import { useUserPools } from '../../features/pools';
import {
  Leaderboard,
  StandingsBannerWaitingSetlist,
  StandingsFilterTabs,
  StandingsScopeIntro,
  useDisplayedPicks,
  useStandings,
  useStandingsLeaderboardView,
  useScoringRulesModal,
} from '../../features/scoring';
import { SHOW_DATES } from '../../shared/data/showDates';
import { getShowStatus } from '../../shared/utils/timeLogic.js';
import { showOptionLabelCompact } from '../../shared/utils/showOptionLabel.js';
import Card from '../../shared/ui/Card';
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
  const { openScoringRules } = useScoringRulesModal();

  useStandingsLeaderboardView(selectedDate, loading);

  const showLabel = useMemo(() => {
    const show = SHOW_DATES.find((s) => s.date === selectedDate);
    return show ? showOptionLabelCompact(show) : selectedDate;
  }, [selectedDate]);

  const activePoolName = useMemo(() => {
    if (activeFilter === 'global') return null;
    return userPools?.find((p) => p.id === activeFilter)?.name ?? null;
  }, [activeFilter, userPools]);

  const leaderboardTitle =
    activeFilter === 'global' ? 'Everyone' : activePoolName || 'This pool';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 mt-20 text-emerald-400 font-bold">
        <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
        <p>Loading show standings for {showLabel}…</p>
      </div>
    );
  }

  if (showStatus === 'FUTURE') {
    return (
      <Card variant="default" padding="lg" className="text-center">
        <PageTitle as="h2" variant="section" className="mb-2">
          Show standings aren&apos;t up yet
        </PageTitle>
        <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed">
          This date hasn&apos;t happened yet. Lock picks from the Picks tab, then come back to the
          Standings tab after the show for live scores and the show standings order.
        </p>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <StandingsScopeIntro
        activeFilter={activeFilter}
        poolName={activePoolName}
        showLabel={showLabel}
        onOpenPoolHub={
          activeFilter !== 'global'
            ? () => navigate(`/dashboard/pool/${activeFilter}`)
            : undefined
        }
        onOpenScoringRules={openScoringRules}
      />

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
          className="mt-8 flex flex-col items-center justify-center text-center"
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
                  : 'Nobody in this pool submitted picks for this date.'}
              </p>
            </>
          ) : (
            <>
              <Music className="mb-4 h-14 w-14 text-emerald-400/80" strokeWidth={1.5} aria-hidden />
              <PageTitle as="h3" variant="section" className="mb-2">
                No picks yet
              </PageTitle>
              <p className="text-slate-400 font-bold max-w-sm">
                {activeFilter === 'global'
                  ? 'Be the first to lock in picks for this show — head to the Picks tab.'
                  : 'Nobody in this pool has locked in yet. Invite friends from My pools.'}
              </p>
            </>
          )}
        </Card>
      ) : (
        <Leaderboard
          poolPicks={displayedPicks}
          actualSetlist={actualSetlist}
          title={leaderboardTitle}
        />
      )}
    </div>
  );
}
