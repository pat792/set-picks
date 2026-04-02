import { useMemo, useState } from 'react';
import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import { calculateTotalScore } from '../../../shared/utils/scoring';

export function useLeaderboard(poolPicks = [], actualSetlist = null) {
  const [expandedUser, setExpandedUser] = useState(null);

  const getPickPayload = (pickEntry) => {
    if (pickEntry?.picks && typeof pickEntry.picks === 'object') {
      return pickEntry.picks;
    }

    // Backward compatibility for legacy docs where picks lived at the root.
    return FORM_FIELDS.reduce((acc, field) => {
      acc[field.id] = pickEntry?.[field.id] || '';
      return acc;
    }, {});
  };

  const sortedPicks = useMemo(() => {
    return [...poolPicks].sort((a, b) => {
      const scoreA = calculateTotalScore(getPickPayload(a), actualSetlist);
      const scoreB = calculateTotalScore(getPickPayload(b), actualSetlist);
      return scoreB - scoreA;
    });
  }, [poolPicks, actualSetlist]);

  const toggleUserExpansion = (userId) => {
    setExpandedUser((prev) => (prev === userId ? null : userId));
  };

  return {
    sortedPicks,
    getPickPayload,
    expandedUser,
    toggleUserExpansion,
  };
}
