import { useCallback } from 'react';

import { resolvePickerOddsLabel } from './selectScorecardOdds';
import { usePickRecommendations } from './usePickRecommendations';

/**
 * Make Picks dropdown odds (#1013 Workstream C). Prefers a cluster-provided
 * artifact (no Lab env gate). Fetches only when the caller omits `artifact`.
 * Returns `getOddsLabel(songName)` for `SongAutocomplete` — no IO in shared.
 *
 * @param {{
 *   selectedDate?: string | null,
 *   artifact?: object | null,
 * }} [args]
 * @returns {(songName: string) => { label: string, compactLabel?: string } | null}
 */
export function useMakePicksOdds({ selectedDate, artifact: artifactProp } = {}) {
  const { artifact: fetchedArtifact } = usePickRecommendations({
    enabled: artifactProp === undefined,
  });
  const artifact = artifactProp !== undefined ? artifactProp : fetchedArtifact;

  return useCallback(
    (songName) => resolvePickerOddsLabel(artifact, selectedDate, songName),
    [artifact, selectedDate],
  );
}
