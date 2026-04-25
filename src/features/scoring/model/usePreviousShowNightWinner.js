import { useEffect, useMemo, useState } from 'react';

import { getShowBeforeDate, getShowStatus } from '../../../shared/utils/timeLogic.js';
import { fetchPicksForShowDate } from '../api/standingsApi';
import { computeShowWinnerOfTheNight } from './useShowWinnerOfTheNight.js';

/**
 * Global winner(s) of the **previous** tour night vs `selectedDate`, for
 * Standings when the selected show is NEXT or LIVE (Option A).
 *
 * Reuses the same eligibility rules as {@link useShowWinnerOfTheNight}.
 *
 * @param {string | undefined} selectedDate — YYYY-MM-DD
 * @param {{ date: string }[] | undefined} showDates
 * @param {boolean} enabled — gate fetches (show/pools standings, NEXT/LIVE only)
 */
export function usePreviousShowNightWinner(selectedDate, showDates, enabled) {
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

  return useMemo(() => {
    const { max, winners, eligiblePlayers, beats } = computeShowWinnerOfTheNight(picks);
    return {
      max,
      winners,
      eligiblePlayers,
      beats,
      loading,
      prevDate,
    };
  }, [picks, loading, prevDate]);
}
