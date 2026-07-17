import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../../auth';
import { useSongCatalog } from '../../song-catalog';
import { computeTourStatsSelfOverlay } from '../api/computeTourStatsSelfOverlay';
import { fetchTourOfficialSetlists } from '../api/fetchTourOfficialSetlists';
import { aggregateTourSetlistStats } from './aggregateTourSetlistStats';

/**
 * Normalized (lowercased/trimmed) title → lifetime times-played, from the song
 * catalog. Used only to break ties in the tour "Most played" list so a pile of
 * one-off songs orders by overall commonness instead of alphabetically.
 *
 * @param {{ name?: string, total?: string }[]} songs
 * @returns {Map<string, number>}
 */
function buildLifetimePlaysByKey(songs) {
  const map = new Map();
  if (!Array.isArray(songs)) return map;
  for (const song of songs) {
    const key = String(song?.name ?? '').trim().toLowerCase();
    if (!key) continue;
    const total = Number(song?.total);
    if (!Number.isFinite(total)) continue;
    map.set(key, total);
  }
  return map;
}

/**
 * Dashboard Tour stats screen (#555): on-demand setlist aggregation + self overlay.
 *
 * Tour scope is owned by Standings chrome (`useStandingsTourSelection`); pass
 * the resolved `selectedTour` so any selectable tour can be explored.
 *
 * @param {{
 *   selectedTour?: { tour: string, shows?: Array<{ date: string }> } | null,
 *   calendarLoading?: boolean,
 * }} [options]
 */
export function useTourStatsScreen(options = {}) {
  const { user } = useAuth();
  const selectedTour = options.selectedTour ?? null;
  const calendarLoading = Boolean(options.calendarLoading);

  const showDates = useMemo(
    () =>
      selectedTour && Array.isArray(selectedTour.shows)
        ? selectedTour.shows.map((s) => s.date).filter(Boolean)
        : [],
    [selectedTour],
  );

  const tourName = selectedTour?.tour || '';
  const uid = user?.uid || '';

  const { songs: catalogSongs } = useSongCatalog();
  const lifetimePlaysByKey = useMemo(
    () => buildLifetimePlaysByKey(catalogSongs),
    [catalogSongs],
  );

  const setlistQuery = useQuery({
    queryKey: ['tour-stats-setlists', tourName, showDates.join(',')],
    enabled: !calendarLoading && showDates.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchTourOfficialSetlists(showDates),
  });

  const stats = useMemo(() => {
    const docs = setlistQuery.data?.docs || [];
    return aggregateTourSetlistStats(docs, {
      tourShowCount: showDates.length,
      lifetimePlaysByKey,
    });
  }, [setlistQuery.data, showDates.length, lifetimePlaysByKey]);

  const overlayQuery = useQuery({
    queryKey: [
      'tour-stats-self-overlay',
      uid,
      tourName,
      showDates.join(','),
      stats.topSongs.map((r) => r.title).join('|'),
    ],
    enabled:
      Boolean(uid) &&
      setlistQuery.isSuccess &&
      (setlistQuery.data?.docs?.length || 0) > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      computeTourStatsSelfOverlay(uid, setlistQuery.data.docs, {
        topSongTitles: stats.topSongs.map((r) => r.title),
      }),
  });

  return {
    calendarLoading,
    tourName,
    showDates,
    hasTour: Boolean(selectedTour),
    stats,
    setlistLoading: setlistQuery.isLoading,
    setlistError: setlistQuery.error,
    setlistReads: setlistQuery.data?.setlistReads ?? 0,
    missingDates: setlistQuery.data?.missingDates ?? [],
    overlay: overlayQuery.data ?? null,
    overlayLoading: overlayQuery.isLoading,
  };
}
