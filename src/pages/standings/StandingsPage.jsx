import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Inbox, Loader2, Music, Scale } from 'lucide-react';

import { useAuth } from '../../features/auth';
import { useNextShowPicksStatus } from '../../features/picks';
import { useUserPools } from '../../features/pools';
import {
  Leaderboard,
  StandingsActiveShowCard,
  StandingsBannerWaitingSetlist,
  StandingsPoolPicker,
  StandingsViewToggle,
  StandingsWinnerOfTheNightBanner,
  TourStandingsSection,
  resolveCurrentTour,
  useDisplayedPicks,
  usePreviousShowNightWinner,
  useShowWinnerOfTheNight,
  useStandings,
  useStandingsLeaderboardView,
  useStandingsView,
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

  const { view, poolId, setView, setPoolId } = useStandingsView({
    userPools,
    navTargetPoolId: targetPoolId || undefined,
  });

  const activeFilter = view === 'pools' && poolId ? poolId : 'global';

  const { picks, actualSetlist, loading } = useStandings(selectedDate, showDates);
  const displayedPicks = useDisplayedPicks({
    picks,
    userPools,
    activeFilter,
  });

  const showStatus = getShowStatus(selectedDate, showDates);
  const { openScoringRules } = useScoringRulesModal();

  // Only fetch pick-status for the "Now picking" active-show card — NEXT is
  // the only status where users can still enter picks (see timeLogic.js).
  // For PAST / LIVE, picks are already in `picks` and no extra read is
  // needed; for FUTURE (a listed show beyond NEXT), picks aren't yet open.
  const picksStatusTarget =
    view === 'show' && showStatus === 'NEXT' ? selectedDate : undefined;
  const { hasSubmittedPicksForNextShow, loading: picksStatusLoading } =
    useNextShowPicksStatus(picksStatusTarget);

  useStandingsLeaderboardView(selectedDate, loading, showDates);

  const globalWinnerOfTheNight = useShowWinnerOfTheNight(picks);
  const poolWinnerOfTheNight = useShowWinnerOfTheNight(displayedPicks);
  const winnerOfTheNight =
    view === 'pools' && Boolean(poolId) ? poolWinnerOfTheNight : globalWinnerOfTheNight;
  const showWinnerEligibleView =
    view === 'show' || (view === 'pools' && Boolean(poolId));
  const showWinnerBanner =
    showWinnerEligibleView &&
    Boolean(actualSetlist) &&
    winnerOfTheNight.winners.length > 0;

  const lastShowWinnerEnabled =
    showWinnerEligibleView &&
    (showStatus === 'NEXT' || showStatus === 'LIVE');
  const previousShowWinner = usePreviousShowNightWinner(
    selectedDate,
    showDates,
    lastShowWinnerEnabled,
  );

  const currentTour = useMemo(
    () => resolveCurrentTour(selectedDate, todayYmd(), showDatesByTour),
    [selectedDate, showDatesByTour],
  );
  const {
    leaders: tourLeaders,
    loading: tourLoading,
    error: tourError,
  } = useTourStandings(view === 'tour' ? currentTour?.shows : null);

  const showLabel = useMemo(() => {
    const show = showDates.find((s) => s.date === selectedDate);
    return show ? showOptionLabelCompact(show) : selectedDate;
  }, [selectedDate, showDates]);

  const activePoolName = useMemo(() => {
    if (view !== 'pools' || !poolId) return null;
    return userPools?.find((p) => p.id === poolId)?.name ?? null;
  }, [view, poolId, userPools]);

  const leaderboardTitle =
    view === 'pools'
      ? activePoolName || 'This pool'
      : 'Everyone';

  const isShowToday = selectedDate === todayYmd();

  return (
    <div className="w-full">
      {/* Scoring rules: sits above the primary IA toggle per #255 — "top-right,
          below the 2nd header" (layout H1) — so it reads as utility chrome,
          not competition with the three-way view switch. */}
      <div className="mb-2 flex items-center justify-end">
        <button
          type="button"
          onClick={openScoringRules}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-content-secondary transition-colors hover:bg-surface-panel hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        >
          <Scale className="h-3.5 w-3.5" aria-hidden />
          Scoring rules
        </button>
      </div>

      <StandingsViewToggle view={view} onChange={setView} />

      {view === 'tour' ? (
        <TourView
          tourName={currentTour?.tour}
          leaders={tourLeaders}
          loading={tourLoading}
          error={tourError}
          hasCurrentTour={Boolean(currentTour)}
        />
      ) : (
        <ShowOrPoolView
          view={view}
          poolId={poolId}
          userPools={userPools}
          setPoolId={setPoolId}
          onOpenPoolHub={
            view === 'pools' && poolId
              ? () => navigate(`/dashboard/pool/${poolId}`)
              : undefined
          }
          loading={loading}
          showStatus={showStatus}
          showLabel={showLabel}
          isShowToday={isShowToday}
          picks={picks}
          actualSetlist={actualSetlist}
          displayedPicks={displayedPicks}
          leaderboardTitle={leaderboardTitle}
          showWinnerBanner={showWinnerBanner}
          previousShowWinner={previousShowWinner}
          winnerOfTheNight={winnerOfTheNight}
          activePoolName={activePoolName}
          selfUserId={user?.uid || null}
          isSecured={hasSubmittedPicksForNextShow}
          picksStatusLoading={picksStatusLoading}
        />
      )}
    </div>
  );
}

function TourView({ tourName, leaders, loading, error, hasCurrentTour }) {
  if (!hasCurrentTour) {
    return (
      <Card variant="default" padding="lg" className="text-center">
        <PageTitle as="h2" variant="section" className="mb-2">
          No tour in progress
        </PageTitle>
        <p className="mx-auto max-w-sm font-bold leading-relaxed text-content-secondary">
          Tour standings will appear once the current tour&apos;s schedule is
          published.
        </p>
      </Card>
    );
  }
  return (
    <TourStandingsSection
      tourName={tourName}
      leaders={leaders}
      loading={loading}
      error={error}
    />
  );
}

function ShowOrPoolView({
  view,
  poolId,
  userPools,
  setPoolId,
  onOpenPoolHub,
  loading,
  showStatus,
  showLabel,
  isShowToday,
  picks,
  actualSetlist,
  displayedPicks,
  leaderboardTitle,
  showWinnerBanner,
  previousShowWinner,
  winnerOfTheNight,
  activePoolName,
  selfUserId,
  isSecured,
  picksStatusLoading,
}) {
  const isPoolsView = view === 'pools';
  const isShowView = view === 'show';

  const showLastShowWinnerBanner =
    !previousShowWinner.loading && previousShowWinner.winners.length > 0;

  if (isPoolsView && !poolId) {
    return (
      <StandingsPoolPicker
        pools={userPools || []}
        activePoolId={null}
        onChange={setPoolId}
      />
    );
  }

  if (loading) {
    return (
      <>
        {isPoolsView ? (
          <StandingsPoolPicker
            pools={userPools || []}
            activePoolId={poolId}
            onChange={setPoolId}
          />
        ) : null}
        <div className="mt-20 flex flex-col items-center justify-center gap-3 font-bold text-brand-primary">
          <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
          <p>Loading standings for {showLabel}…</p>
        </div>
      </>
    );
  }

  // Show view (#255): when the selected date is the next pickable show
  // (NEXT — see timeLogic.js), surface the actionable "tonight's show"
  // CTA as the primary affordance and render the leaderboard beneath
  // it. The CTA stays pinned at the top until showtime regardless of
  // pick status — "Make picks" when not secured, the "edit until
  // showtime" message when already secured (copy mirrors
  // PoolHubActiveShow). Self row is pinned at rank 1 pre-grade.
  if (isShowView && showStatus === 'NEXT') {
    return (
      <>
        {showLastShowWinnerBanner ? (
          <StandingsWinnerOfTheNightBanner
            variant="lastShow"
            winners={previousShowWinner.winners}
            max={previousShowWinner.max}
            beats={previousShowWinner.beats}
          />
        ) : null}
        <StandingsActiveShowCard
          showLabel={showLabel}
          isShowToday={Boolean(isShowToday)}
          isSecured={Boolean(isSecured)}
          picksStatusLoading={Boolean(picksStatusLoading)}
        />
        {displayedPicks.length > 0 ? (
          <div className="mt-6">
            {!actualSetlist && picks.length > 0 ? (
              <StandingsBannerWaitingSetlist />
            ) : null}
            <Leaderboard
              poolPicks={displayedPicks}
              actualSetlist={actualSetlist}
              title={leaderboardTitle}
              selfUserId={selfUserId}
              suppressLeadingCallout={Boolean(showWinnerBanner)}
            />
          </div>
        ) : null}
      </>
    );
  }

  if (showStatus === 'FUTURE') {
    // FUTURE = a listed show beyond the next pickable one; picks aren't
    // open yet, so we keep the neutral "results aren't up yet" copy on
    // both Show and Pools views.
    return (
      <>
        {isPoolsView ? (
          <StandingsPoolPicker
            pools={userPools || []}
            activePoolId={poolId}
            onChange={setPoolId}
          />
        ) : null}
        <Card variant="default" padding="lg" className="text-center">
          <PageTitle as="h2" variant="section" className="mb-2">
            Results aren&apos;t up yet
          </PageTitle>
          <p className="mx-auto max-w-sm font-bold leading-relaxed text-content-secondary">
            This date hasn&apos;t happened yet. Lock your picks on Picks, then check
            Standings after the show for scores and rankings.
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      {isPoolsView ? (
        <StandingsPoolPicker
          pools={userPools || []}
          activePoolId={poolId}
          onChange={setPoolId}
        />
      ) : null}

      {isPoolsView && onOpenPoolHub ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="truncate text-xs font-bold uppercase tracking-widest text-content-secondary">
            {activePoolName || 'This pool'} · {showLabel}
          </p>
          <button
            type="button"
            onClick={onOpenPoolHub}
            className="shrink-0 rounded-full border border-border-subtle bg-surface-panel px-3 py-1 text-xs font-semibold text-content-secondary transition-colors hover:bg-surface-panel-strong hover:text-white"
          >
            Pool details
          </button>
        </div>
      ) : null}

      {showLastShowWinnerBanner ? (
        <StandingsWinnerOfTheNightBanner
          variant="lastShow"
          winners={previousShowWinner.winners}
          max={previousShowWinner.max}
          beats={previousShowWinner.beats}
        />
      ) : null}

      {showWinnerBanner ? (
        <StandingsWinnerOfTheNightBanner
          winners={winnerOfTheNight.winners}
          max={winnerOfTheNight.max}
          beats={winnerOfTheNight.beats}
        />
      ) : null}

      {!actualSetlist && picks.length > 0 ? (
        <StandingsBannerWaitingSetlist />
      ) : null}

      {displayedPicks.length === 0 ? (
        <Card
          variant="default"
          padding="lg"
          className="mt-8 flex flex-col items-center justify-center text-center"
        >
          {showStatus === 'PAST' ? (
            <>
              <Inbox
                className="mb-4 h-14 w-14 text-content-secondary"
                strokeWidth={1.5}
                aria-hidden
              />
              <PageTitle as="h3" variant="section" className="mb-2">
                No picks for this show
              </PageTitle>
              <p className="max-w-sm font-bold text-content-secondary">
                {isPoolsView
                  ? 'Nobody in this pool submitted picks for this date.'
                  : 'Nobody submitted picks for this date.'}
              </p>
            </>
          ) : (
            <>
              <Music
                className="mb-4 h-14 w-14 text-brand-primary/80"
                strokeWidth={1.5}
                aria-hidden
              />
              <PageTitle as="h3" variant="section" className="mb-2">
                No picks yet
              </PageTitle>
              <p className="max-w-sm font-bold text-content-secondary">
                {isPoolsView
                  ? 'Nobody in this pool has locked in yet. Invite friends from Pools.'
                  : 'Be the first to lock in picks for this show — head to the Picks tab.'}
              </p>
            </>
          )}
        </Card>
      ) : (
        <Leaderboard
          poolPicks={displayedPicks}
          actualSetlist={actualSetlist}
          title={leaderboardTitle}
          selfUserId={selfUserId}
          suppressLeadingCallout={Boolean(showWinnerBanner)}
        />
      )}
    </>
  );
}
