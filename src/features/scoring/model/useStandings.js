import { useEffect, useState } from 'react';

import { getShowStatus } from '../../../shared/utils/timeLogic.js';
import {
  fetchOfficialSetlistForShow,
  fetchPicksForShowDate,
} from '../api/standingsApi';

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
  }, [showDate, showDates]);

  return { picks, actualSetlist, loading, error };
}
