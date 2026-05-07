import React from 'react';

import {
  SPHERE_2026_RECAP_ID,
  Sphere2026TourRecapInApp,
} from '../../tour-recap';

function coerceNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Maps persisted inbox payload → recap UI by registry template id.
 *
 * @param {{ templateId: string, payload: Record<string, unknown> }} props
 */
export default function CommsRecapMessageBody({ templateId, payload }) {
  if (templateId === SPHERE_2026_RECAP_ID) {
    const rank = coerceNumber(payload.rank);
    const points = coerceNumber(payload.points);
    const wins = coerceNumber(payload.wins);
    const showsPlayed = coerceNumber(payload.showsPlayed);
    const participantCount =
      payload.participantCount != null ? coerceNumber(payload.participantCount) : undefined;

    return (
      <Sphere2026TourRecapInApp
        rank={rank}
        points={points}
        wins={wins}
        showsPlayed={showsPlayed}
        {...(participantCount !== undefined ? { participantCount } : {})}
      />
    );
  }

  return (
    <p className="text-sm font-bold text-amber-200">
      This message uses an unsupported template ({templateId}). Contact support if it persists.
    </p>
  );
}
