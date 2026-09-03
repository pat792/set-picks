import React from 'react';
import { ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PICKS_SELF_RECAP_STANDINGS_LINK } from '../../../shared/config/dashboardVocabulary';
import { formatOverlapLabel } from '../model/computeScorecardOverlap';
import { formatOddsPercent } from '../model/selectScorecardOdds';
import {
  SCORECARD_BODY,
  SCORECARD_EYEBROW,
  SCORECARD_EYEBROW_ICON,
  SCORECARD_METRIC,
  SCORECARD_SHELL,
  SCORECARD_SLOT_LABEL,
  SCORECARD_TITLE,
} from './picksScorecardClasses';

export const SCORECARD_EMPTY_TITLE = 'No picks for this show';
export const SCORECARD_EMPTY_BODY =
  'Lock a card on Make Picks to see your Scorecard for the selected night.';
export const SCORECARD_PRE_LOCK_COPY =
  'Overlap unlocks after picks lock. Your card stays private until showtime.';
export const SCORECARD_LOCKED_UNGRADED_COPY =
  'Picks are locked. Rank and points land when the official setlist is posted.';
export const SCORECARD_GRADED_COPY = 'Show results for the selected night.';
export const SCORECARD_LOADING_LABEL = 'Loading scorecard';
export const SCORECARD_RANK_PENDING = 'Rank updates after the setlist is posted.';
export const SCORECARD_ODDS_HINT = 'model odds';

function stateCopy(state) {
  if (state === 'empty') return SCORECARD_EMPTY_BODY;
  if (state === 'pre_lock') return SCORECARD_PRE_LOCK_COPY;
  if (state === 'locked_ungraded') return SCORECARD_LOCKED_UNGRADED_COPY;
  if (state === 'graded') return SCORECARD_GRADED_COPY;
  return '';
}

/**
 * Global, show-scoped Scorecard (#767). Presentational — data from
 * {@link usePicksScorecard}.
 *
 * @param {{
 *   isLoading?: boolean,
 *   state: 'empty' | 'pre_lock' | 'locked_ungraded' | 'graded',
 *   showLabel?: string,
 *   slots?: Array<{
 *     fieldId: string,
 *     label: string,
 *     song: string,
 *     alsoPickedCount: number | null,
 *     playProb: number | null,
 *     oddsUnknown?: boolean,
 *   }>,
 *   showOverlap?: boolean,
 *   showOdds?: boolean,
 *   showRank?: boolean,
 *   recap?: {
 *     displayRank: number | null,
 *     totalPlayers: number,
 *     totalScore: number | null,
 *   } | null,
 *   standingsTo?: string,
 *   makePicksTo?: string,
 *   className?: string,
 * }} props
 */
export default function PicksScorecardCard({
  isLoading = false,
  state,
  showLabel = '',
  slots = [],
  showOverlap = false,
  showOdds = false,
  showRank = false,
  recap = null,
  standingsTo = '/dashboard/standings',
  makePicksTo = '/dashboard',
  className = '',
}) {
  const copy = stateCopy(state);
  const playerWord = recap?.totalPlayers === 1 ? 'player' : 'players';

  return (
    <section
      className={`${SCORECARD_SHELL} ${className}`}
      aria-label="Scorecard"
      aria-busy={isLoading || undefined}
    >
      <p className={`inline-flex items-center gap-1.5 ${SCORECARD_EYEBROW}`}>
        <ClipboardList className={SCORECARD_EYEBROW_ICON} aria-hidden />
        Scorecard
      </p>

      {isLoading ? (
        <p className={`mt-2 ${SCORECARD_BODY}`}>{SCORECARD_LOADING_LABEL}…</p>
      ) : null}

      {!isLoading && state === 'empty' ? (
        <div className="mt-1">
          <p className={SCORECARD_TITLE}>{SCORECARD_EMPTY_TITLE}</p>
          <p className={`mt-1 ${SCORECARD_BODY}`}>{SCORECARD_EMPTY_BODY}</p>
          <Link
            to={makePicksTo}
            className="mt-3 inline-flex text-sm font-bold text-violet-200 underline-offset-2 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
          >
            Go to Make Picks
          </Link>
        </div>
      ) : null}

      {!isLoading && state !== 'empty' ? (
        <>
          {showLabel ? (
            <p className={`mt-1 ${SCORECARD_BODY}`}>{showLabel}</p>
          ) : null}

          {showRank ? (
            <div className="mt-3 border-t border-violet-400/20 pt-3">
              {recap?.displayRank != null ? (
                <p
                  className={SCORECARD_TITLE}
                  aria-label={`Rank ${recap.displayRank} of ${recap.totalPlayers} ${playerWord}${
                    recap.totalScore != null ? `, ${recap.totalScore} points` : ''
                  }`}
                >
                  <span className="tabular-nums">#{recap.displayRank}</span>
                  <span className="font-bold text-content-secondary"> of </span>
                  <span className="tabular-nums">{recap.totalPlayers}</span>
                  <span className="font-bold text-content-secondary"> {playerWord}</span>
                  <span className="mx-1.5 text-content-secondary">·</span>
                  <span className="tabular-nums text-violet-200">
                    {recap.totalScore != null ? recap.totalScore : '—'}
                  </span>
                  <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-content-secondary">
                    pts
                  </span>
                </p>
              ) : (
                <p className={SCORECARD_BODY}>{SCORECARD_RANK_PENDING}</p>
              )}
              <Link
                to={standingsTo}
                className="mt-1.5 inline-flex text-xs font-bold text-violet-200 underline-offset-2 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
              >
                {PICKS_SELF_RECAP_STANDINGS_LINK}
              </Link>
            </div>
          ) : null}

          <ul className="mt-3 space-y-2.5">
            {slots.map((slot) => {
              const odds = showOdds
                ? formatOddsPercent(slot.playProb, { unknown: slot.oddsUnknown })
                : null;
              return (
                <li
                  key={slot.fieldId}
                  className="rounded-lg border border-violet-400/15 bg-surface-panel/40 px-3 py-2"
                >
                  <p className={SCORECARD_SLOT_LABEL}>{slot.label}</p>
                  <p className={`mt-0.5 ${SCORECARD_TITLE}`}>{slot.song}</p>
                  {showOverlap ? (
                    <p className={`mt-1 ${SCORECARD_METRIC}`}>
                      {formatOverlapLabel(slot.alsoPickedCount ?? 0)}
                    </p>
                  ) : null}
                  {odds ? (
                    <p className={SCORECARD_METRIC}>
                      {odds} {SCORECARD_ODDS_HINT}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {copy ? <p className={`mt-3 ${SCORECARD_BODY}`}>{copy}</p> : null}
        </>
      ) : null}
    </section>
  );
}
