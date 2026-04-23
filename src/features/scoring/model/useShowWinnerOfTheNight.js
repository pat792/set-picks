import { useMemo } from 'react';

import {
  pickCountsTowardSeason,
  reduceShowWinners,
} from '../../../shared/utils/showAggregation';

/**
 * Pure computation behind {@link useShowWinnerOfTheNight}, exported for unit
 * tests and any non-React caller that needs the same shape (e.g. the Tour
 * standings reducer in #219).
 *
 * @param {Array<{ isGraded?: boolean, score?: number, picks?: unknown } & Record<string, unknown>>} picks
 * @returns {{
 *   max: number | null,
 *   winners: Array<Record<string, unknown>>,
 *   eligiblePlayers: number,
 *   beats: number,
 * }}
 */
export function computeShowWinnerOfTheNight(picks) {
  const list = Array.isArray(picks) ? picks : [];
  const eligible = list.filter(pickCountsTowardSeason);
  const { max, winners } = reduceShowWinners(eligible);
  const eligiblePlayers = eligible.length;
  const beats = Math.max(0, eligiblePlayers - winners.length);
  return { max, winners, eligiblePlayers, beats };
}

/**
 * Overall winner(s) of the night for the Standings "winner of the night"
 * banner (#218). Shares the same "global max per show, ties share,
 * `max === 0 → skip`" rule as Profile `Wins` (#217) and Tour standings
 * (#219).
 *
 * Expects the full, un-filtered list of picks for a single show — the banner
 * is explicitly non-pool-scoped (pool-level winners live in pool details).
 * Only picks with `isGraded === true` and at least one non-empty slot are
 * eligible, so the banner naturally stays hidden during live scoring until
 * the CF rollup runs.
 *
 * `eligiblePlayers` is the count of graded non-empty picks for the show, and
 * `beats = eligiblePlayers - winners.length` drives the "beat N players"
 * subcopy.
 *
 * @param {Array<{ uid?: string, userId?: string, handle?: string, score?: number, isGraded?: boolean, picks?: unknown } & Record<string, unknown>>} picks
 */
export function useShowWinnerOfTheNight(picks) {
  return useMemo(() => computeShowWinnerOfTheNight(picks), [picks]);
}
