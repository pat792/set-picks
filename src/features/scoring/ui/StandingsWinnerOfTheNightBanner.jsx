import React, { Fragment } from 'react';

import { tonightsWinnerHeading } from '../../../shared/config/dashboardVocabulary';
import PlayerHandleLink from '../../../shared/ui/PlayerHandleLink';

/**
 * "Overall winner of the night" callout for `/dashboard/standings` (#218).
 *
 * Renders nothing when there are no eligible winners, so the page can mount
 * this unconditionally and let the feature decide visibility.
 *
 * Ties: every winner is listed as its own `/user/:uid` link, joined with
 * commas — same link treatment as Pool hub leaderboard / show standings rows
 * (#222).
 *
 * @param {{
 *   winners: Array<{
 *     uid?: string,
 *     userId?: string,
 *     handle?: string,
 *     score?: number,
 *   } & Record<string, unknown>>,
 *   max: number | null,
 *   beats?: number,
 * }} props
 */
export default function StandingsWinnerOfTheNightBanner({ winners, max, beats = 0 }) {
  if (!Array.isArray(winners) || winners.length === 0 || max == null) {
    return null;
  }

  const heading = tonightsWinnerHeading(winners.length);
  const handlesLabel = winners.map((w) => w.handle || 'Anonymous').join(', ');

  return (
    <section
      role="status"
      aria-label={`${heading}: ${handlesLabel} — ${max} points`}
      className="mx-0.5 mb-4 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/[0.12] via-amber-500/[0.06] to-brand-primary/[0.08] px-4 py-3 shadow-inset-glass"
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">
        {heading}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-100">
        {winners.map((w, idx) => {
          const playerUserId = w.userId || w.uid;
          const handle = w.handle || 'Anonymous';
          const separator = idx === 0 ? null : ', ';
          return (
            <Fragment key={playerUserId || `${handle}-${idx}`}>
              {separator}
              <PlayerHandleLink userId={playerUserId} handle={handle} />
            </Fragment>
          );
        })}
        {' — '}
        <span className="tabular-nums text-white">{max}</span>
        <span className="font-semibold text-content-secondary"> pts</span>
        {beats > 0 ? (
          <span className="ml-2 text-xs font-semibold text-content-secondary">
            (beat {beats} {beats === 1 ? 'player' : 'players'})
          </span>
        ) : null}
      </p>
    </section>
  );
}
