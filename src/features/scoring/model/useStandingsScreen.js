import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth';
import { useNextShowPicksStatus } from '../../picks';
import { useUserPools } from '../../pools';
import { useShowCalendar } from '../../show-calendar';
import { todayYmd } from '../../../shared/utils/dateUtils';
import { getShowStatus, shouldRedactOpponentPicksPreLock } from '../../../shared/utils/timeLogic';
import { showOptionLabelCompact } from '../../../shared/utils/showOptionLabel';

import { resolveCurrentTour } from './resolveCurrentTour';
import { useDisplayedPicks } from './useDisplayedPicks';
import { usePreviousShowNightWinner } from './usePreviousShowNightWinner';
import { useShowWinnerOfTheNight } from './useShowWinnerOfTheNight';
import { useStandings } from './useStandings';
import { useStandingsLeaderboardView } from './useStandingsLeaderboardView';
import { useStandingsView } from './useStandingsView';
import { useTourStandings } from './useTourStandings';
import { useScoringRulesModal } from '../ui/ScoringRulesModalProvider';

/**
 * Screen-level orchestration for `/dashboard/standings`. Owns every
 * derived flag the page needs to render so `StandingsPage` can stay
 * declarative — it just spreads this hook's return into the relevant
 * view sub-components.
 *
 * Lives in `features/scoring/model` per `.cursorrules` §2: pages should
 * not accumulate non-trivial derived state, navigation callbacks, and
 * cross-feature hook wiring. Mirrors the spirit of `usePoolHub` for the
 * pools surface.
 *
 * @param {string} selectedDate `YYYY-MM-DD` selected via the dashboard
 *   date picker (passed through from `DashboardLayout`).
 */
export function useStandingsScreen(selectedDate) {
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
  const redactOpponentPicksPreLock = shouldRedactOpponentPicksPreLock(
    actualSetlist,
    showStatus,
  );
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
  const showLastShowWinnerBanner =
    !previousShowWinner.loading && previousShowWinner.winners.length > 0;

  /** Deep link to full standings for the prior night (Show tab only; see #305). */
  const lastShowViewResults = useMemo(() => {
    const d = previousShowWinner.prevDate;
    if (!d) return null;
    const show = showDates.find((s) => s.date === d);
    if (!show) return null;
    return {
      showDate: d,
      labelCompact: showOptionLabelCompact(show),
    };
  }, [previousShowWinner.prevDate, showDates]);

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
    view === 'pools' ? activePoolName || 'This pool' : 'Everyone';

  const isShowToday = selectedDate === todayYmd();

  const onOpenPoolHub = useCallback(() => {
    if (view !== 'pools' || !poolId) return;
    navigate(`/dashboard/pool/${poolId}`);
  }, [navigate, view, poolId]);
  // The page only renders the "Pool details" CTA when this callback is
  // wired, so expose it as `null` outside the pools-with-selection state
  // to keep the conditional in the JSX trivially boolean.
  const onOpenPoolHubOrNull =
    view === 'pools' && poolId ? onOpenPoolHub : null;

  return {
    view,
    setView,
    poolId,
    setPoolId,
    userPools,
    onOpenPoolHub: onOpenPoolHubOrNull,
    openScoringRules,

    currentTour,
    tourLeaders,
    tourLoading,
    tourError,

    loading,
    showStatus,
    showLabel,
    isShowToday,
    picks,
    actualSetlist,
    displayedPicks,
    leaderboardTitle,
    activePoolName,
    selfUserId: user?.uid || null,
    isSecured: hasSubmittedPicksForNextShow,
    picksStatusLoading,

    showWinnerBanner,
    winnerOfTheNight,
    previousShowWinner,
    showLastShowWinnerBanner,
    lastShowViewResults,

    redactOpponentPicksPreLock,
  };
}
