import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../../auth';
import { useSongCatalog } from '../../song-catalog';
import { tourLabelToSlug } from '../../../shared/lib/tourSlug';
import { computeTourStatsSelfOverlay } from '../api/computeTourStatsSelfOverlay';
import { fetchPublicTourStatsDoc } from '../api/fetchPublicTourStats';
import { fetchTourOfficialSetlists } from '../api/fetchTourOfficialSetlists';
import {
  aggregateTourSetlistStats,
  TOUR_STATS_TOP_N,
} from './aggregateTourSetlistStats';
import { mergeLastPlayedIntoStats } from './mergePublicLastPlayed';
import { trackTourStatsView } from './tourStatsAnalytics';

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

  // "Last played" dates for bustout/high-gap rows come from phish.net song
  // history and only exist in the server-written public payload (#666). The
  // dashboard borrows them from the world-readable public doc; if the doc is
  // missing or not yet enriched, the column simply doesn't render.
  const publicDocQuery = useQuery({
    queryKey: ['tour-stats-public-doc', tourLabelToSlug(tourName)],
    enabled: Boolean(tourName),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: () => fetchPublicTourStatsDoc(tourLabelToSlug(tourName)),
  });

  const stats = useMemo(() => {
    const docs = setlistQuery.data?.docs || [];
    const aggregated = aggregateTourSetlistStats(docs, {
      tourShowCount: showDates.length,
      lifetimePlaysByKey,
    });
    return mergeLastPlayedIntoStats(aggregated, publicDocQuery.data ?? null);
  }, [setlistQuery.data, showDates.length, lifetimePlaysByKey, publicDocQuery.data]);

  // #709: `stats.topSongs` is now the FULL ranked list. The "In most played"
  // overlay tile must stay pinned to the top 15 — otherwise it degrades into
  // "overlap with every played song".
  const overlayTopSongTitles = useMemo(
    () => stats.topSongs.slice(0, TOUR_STATS_TOP_N).map((r) => r.title),
    [stats.topSongs],
  );

  const overlayQuery = useQuery({
    queryKey: [
      'tour-stats-self-overlay',
      uid,
      tourName,
      showDates.join(','),
      overlayTopSongTitles.join('|'),
    ],
    enabled:
      Boolean(uid) &&
      setlistQuery.isSuccess &&
      (setlistQuery.data?.docs?.length || 0) > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      computeTourStatsSelfOverlay(uid, setlistQuery.data.docs, {
        topSongTitles: overlayTopSongTitles,
      }),
  });

  const tourViewLoggedRef = useRef('');
  useEffect(() => {
    if (calendarLoading || !selectedTour || !tourName) return;
    if (setlistQuery.isLoading || setlistQuery.isError) return;
    if (!setlistQuery.isSuccess) return;
    if (tourViewLoggedRef.current === tourName) return;
    tourViewLoggedRef.current = tourName;
    trackTourStatsView({ tour: tourName });
  }, [
    calendarLoading,
    selectedTour,
    tourName,
    setlistQuery.isLoading,
    setlistQuery.isError,
    setlistQuery.isSuccess,
  ]);

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
