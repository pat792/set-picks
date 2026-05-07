import { useEffect, useState } from 'react';

import { getShowStatus } from '../../../shared/utils/timeLogic.js';
import {
  fetchOfficialSetlistForShow,
  fetchPicksForShowDate,
  subscribeOfficialSetlistForShow,
  subscribePicksForShowDate,
} from '../api/standingsApi';

/** Tab hidden → tear down LIVE Firestore listeners after this delay (#311). */
const LIVE_LISTENER_HIDE_DEBOUNCE_MS = 60_000;

export function useStandings(showDate, showDates) {
  const [picks, setPicks] = useState([]);
  const [actualSetlist, setActualSetlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!showDate) {
      setPicks([]);
      setActualSetlist(null);
      setLoading(false);
      setError(null);
      return;
    }

    const showStatus =
      Array.isArray(showDates) && showDates.length > 0
        ? getShowStatus(showDate, showDates)
        : 'FUTURE';

    if (showStatus === 'FUTURE') {
      setPicks([]);
      setActualSetlist(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    if (showStatus !== 'LIVE') {
      setLoading(true);
      setError(null);

      (async () => {
        try {
          const [fetchedPicks, setlist] = await Promise.all([
            fetchPicksForShowDate(showDate),
            fetchOfficialSetlistForShow(showDate),
          ]);
          if (!cancelled) {
            setPicks(fetchedPicks);
            setActualSetlist(setlist);
          }
        } catch (err) {
          if (!cancelled) {
            setError(err);
            console.error('Error fetching standings data:', err);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    let unsubscribers = [];
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
          setError(err);
          console.error('useStandings live listener error:', err);
        }
      };

      unsubscribers.push(
        subscribePicksForShowDate(
          showDate,
          (nextPicks) => {
            if (!cancelled) setPicks(nextPicks);
          },
          onErr
        )
      );
      unsubscribers.push(
        subscribeOfficialSetlistForShow(
          showDate,
          (nextSetlist) => {
            if (!cancelled) setActualSetlist(nextSetlist);
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

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [fetchedPicks, setlist] = await Promise.all([
          fetchPicksForShowDate(showDate),
          fetchOfficialSetlistForShow(showDate),
        ]);
        if (!cancelled) {
          setPicks(fetchedPicks);
          setActualSetlist(setlist);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          console.error('Error fetching standings data:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (cancelled) return;

      if (document.visibilityState === 'visible') {
        attachLiveListeners();
      }
    })();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearHideTimer();
      tearDownListeners();
    };
  }, [showDate, showDates]);

  return { picks, actualSetlist, loading, error };
}
