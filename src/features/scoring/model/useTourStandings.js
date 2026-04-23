import { useEffect, useState } from 'react';

import { fetchPicksForShowDate } from '../api/standingsApi';
import { aggregateTourStandings } from './aggregateTourStandings';

const FETCH_CHUNK_SIZE = 8;

/**
 * Global Tour standings (#219) — running points, wins, and shows across the
 * current tour. Scope comes from `show_calendar.showDatesByTour` via
 * {@link resolveCurrentTour}; callers pass the resolved `tour.shows`.
 *
 * Read cost per invocation = `|tour.shows|` collection queries
 * (`picks where showDate == date`), chunked at {@link FETCH_CHUNK_SIZE}. If
 * this becomes hot, materialize via `rollupScoresForShow` — see #220.
 *
 * @typedef {import('./aggregateTourStandings').TourStandingsRow} TourStandingsRow
 *
 * @param {Array<{ date: string, venue?: string }> | null | undefined} tourShows
 * @returns {{
 *   leaders: TourStandingsRow[],
 *   loading: boolean,
 *   error: Error | null,
 * }}
 */
export function useTourStandings(tourShows) {
  const [leaders, setLeaders] = useState(/** @type {TourStandingsRow[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {Error | null} */ (null));

  const key = Array.isArray(tourShows)
    ? tourShows.map((s) => s.date).filter(Boolean).join('|')
    : '';

  useEffect(() => {
    let cancelled = false;
    const dates = key ? key.split('|') : [];
    if (dates.length === 0) {
      setLeaders([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        /** @type {Array<{ date: string, picks: Array<Record<string, unknown>> }>} */
        const byDate = [];
        for (let i = 0; i < dates.length; i += FETCH_CHUNK_SIZE) {
          const slice = dates.slice(i, i + FETCH_CHUNK_SIZE);
          const results = await Promise.all(
            slice.map((date) =>
              fetchPicksForShowDate(date).then((picks) => ({ date, picks }))
            )
          );
          for (const r of results) byDate.push(r);
          if (cancelled) return;
        }
        if (cancelled) return;
        const nextLeaders = aggregateTourStandings(byDate);
        setLeaders(nextLeaders);
      } catch (e) {
        if (cancelled) return;
        console.error('useTourStandings error:', e);
        setError(e instanceof Error ? e : new Error('Failed to load tour standings.'));
        setLeaders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { leaders, loading, error };
}
