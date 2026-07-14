import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getShowStatus } from '../../../shared/utils/timeLogic.js';
import {
  fetchOfficialSetlistForShow,
  fetchPicksForShowDate,
  subscribeOfficialSetlistForShow,
  subscribePicksForShowDate,
} from '../api/standingsApi';

/** Tab hidden → tear down LIVE Firestore listeners after this delay (#311). */
const LIVE_LISTENER_HIDE_DEBOUNCE_MS = 60_000;

/**
 * Stable fingerprint so calendar snapshot reference churn does not re-trigger
 * standings work when date/TZ membership is unchanged (#507).
 *
 * @param {Array<{ date?: string, timeZone?: string } | string> | null | undefined} showDates
 */
export function showDatesStatusKey(showDates) {
  if (!Array.isArray(showDates) || showDates.length === 0) return '';
  return showDates
    .map((s) => {
      if (typeof s === 'string') return s.trim();
      const date = typeof s?.date === 'string' ? s.date.trim() : '';
      const tz = typeof s?.timeZone === 'string' ? s.timeZone.trim() : '';
      return date ? `${date}@${tz}` : '';
    })
    .filter(Boolean)
    .join('|');
}

/**
 * Show-scoped standings (#507). Snapshot path uses React Query (default
 * staleTime 60s from `main.jsx`) so Safari/PWA tab revisits skip the full-page
 * spinner. LIVE shows still attach visibility-gated Firestore listeners after
 * the initial snapshot seed.
 *
 * @param {string} showDate
 * @param {Array<{ date?: string, timeZone?: string } | string> | null | undefined} showDates
 */
export function useStandings(showDate, showDates) {
  const statusKey = useMemo(() => showDatesStatusKey(showDates), [showDates]);
  const showStatus = useMemo(() => {
    if (!showDate || !statusKey) return 'FUTURE';
    return Array.isArray(showDates) && showDates.length > 0
      ? getShowStatus(showDate, showDates)
      : 'FUTURE';
  }, [showDate, showDates, statusKey]);

  const enabled = Boolean(showDate) && showStatus !== 'FUTURE';

  const query = useQuery({
    queryKey: ['standings-show', showDate],
    enabled,
    queryFn: async () => {
      const [picks, actualSetlist] = await Promise.all([
        fetchPicksForShowDate(showDate),
        fetchOfficialSetlistForShow(showDate),
      ]);
      return { picks, actualSetlist };
    },
  });

  const [livePicks, setLivePicks] = useState(
    /** @type {Array<Record<string, unknown>> | null} */ (null)
  );
  const [liveSetlist, setLiveSetlist] = useState(
    /** @type {Record<string, unknown> | null | undefined} */ (undefined)
  );

  useEffect(() => {
    if (query.isError) {
      console.error('useStandings query error:', query.error);
    }
  }, [query.isError, query.error]);

  useEffect(() => {
    if (showStatus !== 'LIVE' || !showDate) {
      setLivePicks(null);
      setLiveSetlist(undefined);
      return undefined;
    }

    let cancelled = false;
    /** @type {Array<() => void>} */
    let unsubscribers = [];
    /** @type {ReturnType<typeof setTimeout> | null} */
    let hideTimer = null;

    const clearHideTimer = () => {
      if (hideTimer != null) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const tearDownListeners = () => {
      unsubscribers.forEach((u) => u());
      unsubscribers = [];
    };

    const attachLiveListeners = () => {
      tearDownListeners();
      if (cancelled) return;

      const onErr = (err) => {
        if (!cancelled) {
          console.error('useStandings live listener error:', err);
        }
      };

      unsubscribers.push(
        subscribePicksForShowDate(
          showDate,
          (nextPicks) => {
            if (!cancelled) setLivePicks(nextPicks);
          },
          onErr
        )
      );
      unsubscribers.push(
        subscribeOfficialSetlistForShow(
          showDate,
          (nextSetlist) => {
            if (!cancelled) setLiveSetlist(nextSetlist);
          },
          onErr
        )
      );
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearHideTimer();
        attachLiveListeners();
      } else {
        clearHideTimer();
        hideTimer = window.setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            tearDownListeners();
          }
        }, LIVE_LISTENER_HIDE_DEBOUNCE_MS);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    if (document.visibilityState === 'visible') {
      attachLiveListeners();
    }

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearHideTimer();
      tearDownListeners();
      setLivePicks(null);
      setLiveSetlist(undefined);
    };
  }, [showDate, showStatus]);

  if (!enabled) {
    return { picks: [], actualSetlist: null, loading: false, error: null };
  }

  const picks = livePicks ?? query.data?.picks ?? [];
  const actualSetlist =
    liveSetlist !== undefined
      ? liveSetlist
      : (query.data?.actualSetlist ?? null);

  return {
    picks,
    actualSetlist,
    // Full-page / card spinners only on first miss — not background refetch (#507).
    loading: query.isPending,
    error: query.isError
      ? query.error instanceof Error
        ? query.error
        : new Error('Failed to load standings.')
      : null,
  };
}
