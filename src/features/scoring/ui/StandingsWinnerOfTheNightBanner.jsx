import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';

import {
  lastShowWinnerHeading,
  tonightsWinnerHeading,
} from '../../../shared/config/dashboardVocabulary';
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
 *   variant?: 'tonight' | 'lastShow',
 *   viewResults?: { showDate: string, labelCompact: string } | null,
 * }} props
 */
export default function StandingsWinnerOfTheNightBanner({
  winners,
  max,
  beats = 0,
  variant = 'tonight',
  viewResults = null,
}) {
  if (!Array.isArray(winners) || winners.length === 0 || max == null) {
    return null;
  }

  const heading =
    variant === 'lastShow'
      ? lastShowWinnerHeading(winners.length)
      : tonightsWinnerHeading(winners.length);
  const handlesLabel = winners.map((w) => w.handle || 'Anonymous').join(', ');

  const showViewResultsLink =
    variant === 'lastShow' &&
    viewResults &&
    typeof viewResults.showDate === 'string' &&
    viewResults.showDate.length > 0;

  const viewResultsHint =
    viewResults?.labelCompact ||
    (showViewResultsLink ? viewResults.showDate : '');

  return (
    <section
      role="status"
      aria-label={`${heading}: ${handlesLabel} — ${max} points`}
      className="mx-0.5 mb-4 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/[0.12] via-amber-500/[0.06] to-brand-primary/[0.08] px-3 py-2 shadow-inset-glass"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <p className="min-w-0 text-[10px] font-black uppercase tracking-widest text-amber-300">
          {heading}
        </p>
        {showViewResultsLink ? (
          <Link
            to={`/dashboard/standings?showDate=${encodeURIComponent(viewResults.showDate)}`}
            title={
              viewResultsHint
                ? `Open full standings for ${viewResultsHint}`
                : 'Open full standings for this show'
            }
            aria-label={
              viewResultsHint
                ? `View full standings for ${viewResultsHint}`
                : 'View full standings for this show'
            }
            className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-amber-200/95 underline decoration-amber-200/50 underline-offset-2 transition-colors hover:text-white hover:decoration-white/70"
          >
            View results
          </Link>
        ) : null}
      </div>
      <p className="mt-0.5 text-sm font-bold leading-snug text-slate-100">
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
          <span className="ml-1.5 text-xs font-semibold text-content-secondary">
            (beat {beats} {beats === 1 ? 'player' : 'players'})
          </span>
        ) : null}
      </p>
    </section>
  );
}
