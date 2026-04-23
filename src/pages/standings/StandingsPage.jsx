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
  StandingsWinnerOfTheNightBanner,
  TourStandingsSection,
  resolveCurrentTour,
  useDisplayedPicks,
  useShowWinnerOfTheNight,
  useStandings,
  useStandingsLeaderboardView,
  useScoringRulesModal,
  useTourStandings,
} from '../../features/scoring';
import { useShowCalendar } from '../../features/show-calendar';
import { todayYmd } from '../../shared/utils/dateUtils.js';
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
  const { showDates, showDatesByTour } = useShowCalendar();
  const { pools: userPools } = useUserPools(user?.uid);
  const { picks, actualSetlist, loading } = useStandings(selectedDate, showDates);
  const { displayedPicks, activeFilter, setActiveFilter, filterOptions } = useDisplayedPicks(
    picks,
    user,
    userPools,
    targetPoolId || undefined
  );

  const showStatus = getShowStatus(selectedDate, showDates);
  const { openScoringRules } = useScoringRulesModal();

  useStandingsLeaderboardView(selectedDate, loading, showDates);

  const winnerOfTheNight = useShowWinnerOfTheNight(picks);
  const showWinnerBanner =
    activeFilter === 'global' &&
    Boolean(actualSetlist) &&
    winnerOfTheNight.winners.length > 0;

  const currentTour = useMemo(
    () => resolveCurrentTour(selectedDate, todayYmd(), showDatesByTour),
    [selectedDate, showDatesByTour]
  );
  const {
    leaders: tourLeaders,
    loading: tourLoading,
    error: tourError,
  } = useTourStandings(activeFilter === 'global' ? currentTour?.shows : null);
  const showTourStandings = activeFilter === 'global' && Boolean(currentTour);

  const showLabel = useMemo(() => {
    const show = showDates.find((s) => s.date === selectedDate);
    return show ? showOptionLabelCompact(show) : selectedDate;
  }, [selectedDate, showDates]);

  const activePoolName = useMemo(() => {
    if (activeFilter === 'global') return null;
    return userPools?.find((p) => p.id === activeFilter)?.name ?? null;
  }, [activeFilter, userPools]);

  const leaderboardTitle =
    activeFilter === 'global' ? 'Everyone' : activePoolName || 'This pool';

  if (loading) {
    return (
      <div className="mt-20 flex flex-col items-center justify-center gap-3 font-bold text-brand-primary">
        <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
        <p>Loading standings for {showLabel}…</p>
      </div>
    );
  }

  if (showStatus === 'FUTURE') {
    return (
      <Card variant="default" padding="lg" className="text-center">
        <PageTitle as="h2" variant="section" className="mb-2">
          Results aren&apos;t up yet
        </PageTitle>
        <p className="mx-auto max-w-sm font-bold leading-relaxed text-content-secondary">
          This date hasn&apos;t happened yet. Lock your picks on Picks, then check Standings after the
          show for scores and rankings.
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

      {showWinnerBanner ? (
        <StandingsWinnerOfTheNightBanner
          winners={winnerOfTheNight.winners}
          max={winnerOfTheNight.max}
          beats={winnerOfTheNight.beats}
        />
      ) : null}

      {!actualSetlist && picks.length > 0 ? <StandingsBannerWaitingSetlist /> : null}

      {displayedPicks.length === 0 ? (
        <Card
          variant="default"
          padding="lg"
          className="mt-8 flex flex-col items-center justify-center text-center"
        >
          {showStatus === 'PAST' ? (
            <>
              <Inbox className="mb-4 h-14 w-14 text-content-secondary" strokeWidth={1.5} aria-hidden />
              <PageTitle as="h3" variant="section" className="mb-2">
                No picks for this show
              </PageTitle>
              <p className="max-w-sm font-bold text-content-secondary">
                {activeFilter === 'global'
                  ? 'Nobody submitted picks for this date.'
                  : 'Nobody in this pool submitted picks for this date.'}
              </p>
            </>
          ) : (
            <>
              <Music className="mb-4 h-14 w-14 text-brand-primary/80" strokeWidth={1.5} aria-hidden />
              <PageTitle as="h3" variant="section" className="mb-2">
                No picks yet
              </PageTitle>
              <p className="max-w-sm font-bold text-content-secondary">
                {activeFilter === 'global'
                  ? 'Be the first to lock in picks for this show — head to the Picks tab.'
                  : 'Nobody in this pool has locked in yet. Invite friends from Pools.'}
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

      {showTourStandings ? (
        <TourStandingsSection
          tourName={currentTour?.tour}
          leaders={tourLeaders}
          loading={tourLoading}
          error={tourError}
        />
      ) : null}
    </div>
  );
}
