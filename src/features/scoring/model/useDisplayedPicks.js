import { useMemo } from 'react';

import {
  memberJoinedOnForUser,
  pickDataCountsForPool,
} from '../../pools';

/**
 * Pure derivation: filter the show-scoped picks array down to a target
 * audience. `'global'` (or falsy) passes everything through;
 * a pool id returns only picks whose author is a pool member and whose
 * pick row counts toward that pool's standings.
 *
 * Split out of {@link useDisplayedPicks} so it is unit-testable without
 * `@testing-library/react` (the repo avoids that dep).
 *
 * @param {{
 *   picks: Array<{ userId?: string, showDate?: string } & Record<string, unknown>>,
 *   userPools?: Array<{
 *     id: string,
 *     members?: string[],
 *     name?: string,
 *     standingsScope?: string,
 *     memberJoinedAt?: Record<string, string>,
 *   }> | null,
 *   activeFilter: 'global' | string,
 * }} options
 */
export function filterPicksToAudience({ picks, userPools, activeFilter }) {
  if (activeFilter === 'global' || !activeFilter) return picks;

  const selectedPool = userPools?.find((p) => p.id === activeFilter);
  if (!selectedPool) return picks;

  return picks.filter((pick) => {
    if (!selectedPool.members?.includes(pick.userId)) return false;
    return pickDataCountsForPool(pick, selectedPool.id, {
      standingsScope: selectedPool.standingsScope,
      memberJoinedOn: memberJoinedOnForUser(
        selectedPool.memberJoinedAt,
        pick.userId,
      ),
      showDate: typeof pick.showDate === 'string' ? pick.showDate : null,
    });
  });
}

/**
 * Prior to #255 this hook also owned the URL sync for the active
 * filter; that responsibility has moved to {@link useStandingsView}
 * so the Standings page's top-level pill toggle can share the same URL
 * contract with the pool sub-selector.
 */
export function useDisplayedPicks({ picks, userPools, activeFilter }) {
  return useMemo(
    () => filterPicksToAudience({ picks, userPools, activeFilter }),
    [picks, userPools, activeFilter],
  );
}
