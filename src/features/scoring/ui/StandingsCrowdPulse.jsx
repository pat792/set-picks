import React from 'react';

import {
  CrowdNightPulsePanel,
  useCrowdNightStats,
} from '../../crowd-picks';

/**
 * Standings wiring for crowd pulse prototype — keeps Firestore-derived
 * picks/tour leaders in scoring while presentation lives in crowd-picks.
 *
 * @param {object} props
 * @param {string} props.showDate
 * @param {Array<Record<string, unknown>> | null | undefined} props.picks
 * @param {Array<{ uid: string, handle?: string, totalPoints?: number }> | null | undefined} props.tourLeaders
 * @param {string} [props.showStatus] — NEXT blurs deep stats; LIVE/PAST unlock
 * @param {string} [props.className]
 */
export default function StandingsCrowdPulse({
  showDate,
  picks,
  tourLeaders,
  showStatus = '',
  className = '',
}) {
  const { card, night, catalog, leaders, catalogLoading, ready } =
    useCrowdNightStats(showDate, picks, tourLeaders);

  if (!ready) return null;

  return (
    <CrowdNightPulsePanel
      className={className}
      card={card}
      night={night}
      catalog={catalog}
      leaders={leaders}
      catalogLoading={catalogLoading}
      blurDeepStats={showStatus === 'NEXT'}
    />
  );
}
