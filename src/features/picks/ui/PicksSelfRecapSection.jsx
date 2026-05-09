import React from 'react';
import { ChevronDown } from 'lucide-react';

import {
  PICKS_SELF_RECAP_STANDINGS_LINK,
  STANDINGS_SELF_RECAP_EYEBROW,
} from '../../../shared/config/dashboardVocabulary';
import { StandingsSelfRecapCard } from '../../scoring';

/** Compact stats for `<details>` summary: `#n/total · pts` with full phrase in `aria-label`. */
function recapSummaryCompactStats(recap) {
  const playerWord = recap.totalPlayers === 1 ? 'player' : 'players';

  if (recap.displayRank != null) {
    const score = recap.totalScore != null ? recap.totalScore : '—';
    const ariaLabel = `Rank ${recap.displayRank} of ${recap.totalPlayers} ${playerWord}, ${
      score === '—' ? 'points pending' : `${score} points`
    }`;
    return (
      <p
        className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-sm font-semibold tabular-nums leading-snug sm:text-base"
        aria-label={ariaLabel}
      >
        <span className="font-bold text-white">#{recap.displayRank}</span>
        <span className="text-content-secondary" aria-hidden>
          /
        </span>
        <span className="font-bold text-white">{recap.totalPlayers}</span>
        <span className="font-bold text-content-secondary">·</span>
        <span className="font-bold text-brand-primary">{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-content-secondary">
          pts
        </span>
      </p>
    );
  }

  const score = recap.totalScore != null ? recap.totalScore : '—';
  return (
    <p
      className="mt-0.5 text-sm font-bold leading-snug text-content-secondary"
      aria-label="Rank updates after the setlist is posted. Current points if any."
    >
      <span className="text-brand-primary">You</span>
      <span className="mx-1 font-semibold">·</span>
      <span className="tabular-nums text-brand-primary">{score}</span>
      <span className="ml-1 text-[10px] font-bold uppercase tracking-widest">pts</span>
    </p>
  );
}

/**
 * Picks-tab wrapper: full self-recap on `md+`. On small screens, a `<details>` summary
 * shows label + handle (wraps, not truncated) + compact `#n/total · pts`; the open body
 * reuses {@link StandingsSelfRecapCard} in `bodyOnly` mode so rank/name are not repeated.
 */
export default function PicksSelfRecapSection({
  recap,
  shareGradedRecapAllowed,
  showLabel,
  formData,
  actualSetlist,
  standingsTo,
}) {
  if (!recap) return null;

  const routerJump = { to: standingsTo, label: PICKS_SELF_RECAP_STANDINGS_LINK };

  const cardProps = {
    recap,
    showLabel,
    poolLabel: null,
    userPicks: formData,
    actualSetlist,
    shareGradedRecapAllowed,
    routerJump,
  };

  return (
    <div className="mb-4 mt-2">
      <div className="hidden md:block">
        <StandingsSelfRecapCard {...cardProps} showEyebrow />
      </div>

      <details className="group rounded-xl border border-border-subtle/55 bg-surface-panel/55 shadow-inset-glass ring-1 ring-brand-primary/15 md:hidden">
        <summary className="flex list-none cursor-pointer items-center gap-2 px-3 py-2.5 text-left [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-widest text-amber-200/90">
              {STANDINGS_SELF_RECAP_EYEBROW}
            </p>
            <p
              className="mt-1 break-words text-base font-bold leading-snug text-slate-100"
              title={recap.handle}
            >
              {recap.handle}
            </p>
            {recapSummaryCompactStats(recap)}
          </div>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-content-secondary opacity-80 transition-transform duration-200 ease-out group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="border-t border-border-subtle/40 px-3 pb-3 pt-1">
          <StandingsSelfRecapCard
            {...cardProps}
            bodyOnly
            showEyebrow={false}
            className="border-0 bg-transparent p-0 shadow-none ring-0"
          />
        </div>
      </details>
    </div>
  );
}
