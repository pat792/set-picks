import { useEffect, useState } from 'react';

import { getShowStatus } from '../../../shared/utils/timeLogic.js';
import {
  fetchOfficialSetlistForShow,
  subscribeOfficialSetlistForShow,
} from '../api/standingsApi';

/** @see useStandings — same LIVE hide debounce as full standings (#311). */
const LIVE_LISTENER_HIDE_DEBOUNCE_MS = 60_000;

/**
 * Loads `official_setlists/{showDate}` for surfaces that only need graded truth
 * (e.g. Picks tab share card) without subscribing to the full picks query.
 *
 * @param {string | undefined} showDate
 * @param {{ date: string }[] | undefined} showDates
 */
export function useOfficialSetlistForShow(showDate, showDates) {
  const [actualSetlist, setActualSetlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!showDate) {
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
          const setlist = await fetchOfficialSetlistForShow(showDate);
          if (!cancelled) setActualSetlist(setlist);
        } catch (err) {
          if (!cancelled) {
            setError(err);
            console.error('useOfficialSetlistForShow fetch error:', err);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    let unsub = null;
    let hideTimer = null;

    const clearHideTimer = () => {
      if (hideTimer != null) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const tearDown = () => {
      if (unsub) {
        unsub();
        unsub = null;
      }
    };

    const attach = () => {
      tearDown();
      if (cancelled) return;
      unsub = subscribeOfficialSetlistForShow(
        showDate,
        (next) => {
          if (!cancelled) setActualSetlist(next);
        },
        (err) => {
          if (!cancelled) {
            setError(err);
            console.error('useOfficialSetlistForShow live listener error:', err);
          }
        }
      );
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearHideTimer();
        attach();
      } else {
        clearHideTimer();
        hideTimer = window.setTimeout(() => {
          if (document.visibilityState === 'hidden') tearDown();
        }, LIVE_LISTENER_HIDE_DEBOUNCE_MS);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const setlist = await fetchOfficialSetlistForShow(showDate);
        if (!cancelled) setActualSetlist(setlist);
      } catch (err) {
        if (!cancelled) {
          setError(err);
          console.error('useOfficialSetlistForShow initial fetch error:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (cancelled) return;
      if (document.visibilityState === 'visible') attach();
    })();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearHideTimer();
      tearDown();
    };
  }, [showDate, showDates]);

  return { actualSetlist, loading, error };
}
