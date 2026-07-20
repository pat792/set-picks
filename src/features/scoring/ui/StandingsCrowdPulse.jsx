import React from 'react';

import {
  CrowdNightPulsePanel,
  shouldBlurDeepCrowdStats,
  useCrowdNightStats,
} from '../../crowd-picks';

/**
 * Standings wiring for crowd pulse (#694) — keeps Firestore-derived
 * picks/tour leaders in scoring while presentation lives in crowd-picks.
 *
 * Blur gate: `showStatus === 'NEXT'` → deep stats locked until showtime
 * (LIVE/PAST). See `docs/picks-rollup/04-prelock-disclosure.md`.
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
      blurDeepStats={shouldBlurDeepCrowdStats(showStatus)}
    />
  );
}
