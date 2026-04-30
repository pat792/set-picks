import React, { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  lastShowWinnerHeading,
  tonightsWinnerHeading,
} from '../../../shared/config/dashboardVocabulary';
import DashboardRowPill from '../../../shared/ui/DashboardRowPill';
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
 *   onSelectShowDate?: ((ymd: string) => void) | null,
 *   lastShowPoolScopeLabel?: string | null,
 * }} props
 */
export default function StandingsWinnerOfTheNightBanner({
  winners,
  max,
  beats = 0,
  variant = 'tonight',
  viewResults = null,
  onSelectShowDate = null,
  lastShowPoolScopeLabel = null,
}) {
  const navigate = useNavigate();

  if (!Array.isArray(winners) || winners.length === 0 || max == null) {
    return null;
  }

  const heading =
    variant === 'lastShow'
      ? lastShowWinnerHeading(winners.length, lastShowPoolScopeLabel)
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
    <div
      role="region"
      aria-label={`${heading}: ${handlesLabel} — ${max} points`}
      className="relative mx-0.5 mb-4 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/[0.12] via-amber-500/[0.06] to-brand-primary/[0.08] px-3 py-2 shadow-inset-glass"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        {/*
          If the heading flex item ever paints over the pill (min-width / overflow),
          keep the link above in the hit-test order.
        */}
        <p className="relative z-0 min-w-0 text-[10px] font-black uppercase tracking-widest text-amber-300">
          {heading}
        </p>
        {showViewResultsLink ? (
          <DashboardRowPill
            as="button"
            type="button"
            tone="accent"
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
            className="relative z-10 shrink-0 !border-amber-400/45 !bg-amber-950/35 !text-amber-100 !shadow-none hover:!border-amber-300/55 hover:!bg-amber-500/20 hover:!text-amber-50 focus-visible:!ring-amber-300/70"
            onClick={() => {
              const d = viewResults.showDate;
              // Layout `selectedDate` can differ from URL (picker does not write
              // `showDate`). Re-applying the same `?showDate=` is a navigate
              // no-op — still move the picker via layout state.
              onSelectShowDate?.(d);
              navigate({
                pathname: '/dashboard/standings',
                search: `?showDate=${encodeURIComponent(d)}`,
              });
            }}
          >
            View results
            <ChevronRight className="pointer-events-none h-3 w-3 shrink-0 opacity-90" aria-hidden />
          </DashboardRowPill>
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
    </div>
  );
}
