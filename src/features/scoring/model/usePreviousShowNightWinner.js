import { useEffect, useMemo, useState } from 'react';

import { getShowBeforeDate, getShowStatus } from '../../../shared/utils/timeLogic.js';
import { fetchPicksForShowDate } from '../api/standingsApi';
import { filterPicksToAudience } from './useDisplayedPicks';
import { computeShowWinnerOfTheNight } from './useShowWinnerOfTheNight.js';

/**
 * Winner(s) of the **previous** tour night vs `selectedDate`, for Standings when
 * the selected show is NEXT or LIVE (Option A).
 *
 * Reuses the same eligibility rules as {@link useShowWinnerOfTheNight}. When
 * `audience` targets a pool, the hook still fetches global picks for that date
 * (one read) then filters with {@link filterPicksToAudience} — same contract
 * as the leaderboard.
 *
 * @param {string | undefined} selectedDate — YYYY-MM-DD
 * @param {{ date: string }[] | undefined} showDates
 * @param {boolean} enabled — gate fetches (show/pools standings, NEXT/LIVE only)
 * @param {{ userPools?: Array<{ id: string, members?: string[], name?: string }> | null, activeFilter: 'global' | string } | null | undefined} [audience] —
 *   omit or `activeFilter: 'global'` for everyone; pool id for pool-scoped winner.
 */
export function usePreviousShowNightWinner(selectedDate, showDates, enabled, audience) {
  const prevDate = useMemo(() => {
    if (!enabled || !selectedDate || !Array.isArray(showDates) || showDates.length === 0) {
      return null;
    }
    return getShowBeforeDate(selectedDate, showDates)?.date ?? null;
  }, [selectedDate, showDates, enabled]);

  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!prevDate || !Array.isArray(showDates) || showDates.length === 0) {
      setPicks([]);
      setLoading(false);
      return;
    }

    const status = getShowStatus(prevDate, showDates);
    if (status === 'FUTURE') {
      setPicks([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const fetchedPicks = await fetchPicksForShowDate(prevDate);
        if (cancelled) return;
        setPicks(fetchedPicks);
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching previous show standings:', err);
          setPicks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [prevDate, showDates]);

  const { userPools, activeFilter } = audience ?? {
    userPools: null,
    activeFilter: 'global',
  };

  return useMemo(() => {
    if (!prevDate) {
      return {
        max: null,
        winners: [],
        eligiblePlayers: 0,
        beats: 0,
        loading,
        prevDate: null,
      };
    }
    const scopedPicks = filterPicksToAudience({
      picks,
      userPools,
      activeFilter,
    });
    const { max, winners, eligiblePlayers, beats } =
      computeShowWinnerOfTheNight(scopedPicks);
    return {
      max,
      winners,
      eligiblePlayers,
      beats,
      loading,
      prevDate,
    };
  }, [picks, loading, prevDate, userPools, activeFilter]);
}
