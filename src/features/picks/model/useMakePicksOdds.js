import { useCallback } from 'react';

import { resolvePickerOddsLabel } from './selectScorecardOdds';
import { usePickRecommendations } from './usePickRecommendations';

/**
 * Make Picks dropdown odds (#1013 Workstream C). Fetches the same Lab /
 * Scorecard artifact with `{ enabled: true }` (no Lab env gate). Returns a
 * `getOddsLabel(songName)` callback for `SongAutocomplete` — no IO in shared.
 *
 * @param {{ selectedDate?: string | null }} [args]
 * @returns {(songName: string) => { label: string, compactLabel?: string } | null}
 */
export function useMakePicksOdds({ selectedDate } = {}) {
  const { artifact } = usePickRecommendations({ enabled: true });

  return useCallback(
    (songName) => resolvePickerOddsLabel(artifact, selectedDate, songName),
    [artifact, selectedDate],
  );
}
