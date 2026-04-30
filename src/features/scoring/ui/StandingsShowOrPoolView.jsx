import React from 'react';
import { Inbox, Loader2, Music } from 'lucide-react';

import Card from '../../../shared/ui/Card';
import PageTitle from '../../../shared/ui/PageTitle';
import Leaderboard from './Leaderboard';
import StandingsActiveShowCard from './StandingsActiveShowCard';
import StandingsBannerWaitingSetlist from './StandingsBannerWaitingSetlist';
import StandingsPoolPicker from './StandingsPoolPicker';
import StandingsWinnerOfTheNightBanner from './StandingsWinnerOfTheNightBanner';

/**
 * Standings show / pools-view composition. Pure presentational — all state
 * comes from `useStandingsScreen`. Branches:
 *   1. Pools view, no pool selected → render the pool picker only.
 *   2. Loading → spinner (with picker on top in pools view).
 *   3. Show view, status NEXT → "tonight's show" CTA + leaderboard.
 *   4. Status FUTURE → neutral "results aren't up yet" copy.
 *   5. Default → optional banners + leaderboard or empty state.
 */
export default function StandingsShowOrPoolView({ screen }) {
  const {
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
    showLastShowWinnerBanner,
    lastShowViewResults,
    onSelectShowDate,
    redactOpponentPicksPreLock,
  } = screen;

  const isPoolsView = view === 'pools';
  const isShowView = view === 'show';
  const lastShowViewResultsForShowTab =
    isShowView && lastShowViewResults ? lastShowViewResults : null;

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
            viewResults={lastShowViewResultsForShowTab}
            onSelectShowDate={onSelectShowDate}
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
              redactOpponentPicksPreLock={redactOpponentPicksPreLock}
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
          viewResults={lastShowViewResultsForShowTab}
          onSelectShowDate={onSelectShowDate}
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
          redactOpponentPicksPreLock={redactOpponentPicksPreLock}
        />
      )}
    </>
  );
}
