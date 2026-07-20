import { useMemo } from 'react';

import { useSongCatalog } from '../../song-catalog';

import { aggregateCrowdNightCatalog } from './aggregateCrowdNightCatalog';
import {
  aggregateCrowdNightSongs,
  crowdNightCardSummary,
} from './aggregateCrowdNightSongs';
import {
  aggregateLeadersTonightPicks,
  LEADERS_TOP_K,
} from './aggregateLeadersTonightPicks';

/**
 * Compose C1–C3 crowd night stats for a show date (#694 / Standings).
 *
 * @param {string} showDate
 * @param {Array<Record<string, unknown>> | null | undefined} pickDocs
 * @param {Array<{ uid: string, handle?: string, totalPoints?: number }> | null | undefined} tourLeaders
 */
export function useCrowdNightStats(showDate, pickDocs, tourLeaders) {
  const { songs: catalogSongs, isLoading: catalogLoading } = useSongCatalog();

  return useMemo(() => {
    if (!showDate) {
      return {
        ready: false,
        catalogLoading,
        card: null,
        night: null,
        catalog: null,
        leaders: null,
      };
    }

    const night = aggregateCrowdNightSongs(showDate, pickDocs);
    const card = crowdNightCardSummary(night, { topN: 3 });
    const catalog = aggregateCrowdNightCatalog(night, catalogSongs, {
      gapTopN: 10,
    });
    const leaders = aggregateLeadersTonightPicks(tourLeaders, pickDocs, {
      topK: LEADERS_TOP_K,
    });

    return {
      ready: true,
      catalogLoading,
      card,
      night,
      catalog,
      leaders,
    };
  }, [showDate, pickDocs, tourLeaders, catalogSongs, catalogLoading]);
}
