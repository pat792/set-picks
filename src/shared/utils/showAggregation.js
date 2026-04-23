/**
 * Pure, Firestore-agnostic primitives for the "overall winner of the night"
 * aggregation rule that the profile, standings, and pool surfaces all share.
 *
 * The rule — single source of truth for every cumulative leaderboard:
 *
 *   For a given show, consider every graded, non-empty pick. Let `max` be the
 *   maximum `score` across those picks. If `max` is null or `0`, nobody is
 *   credited a win that night. Otherwise, every pick whose `score === max`
 *   shares the win (ties share).
 *
 * Keeping the rule in one place means Profile `Wins` (shipped in #217),
 * Standings "Overall winner of the night" (#218), global Tour standings
 * (#219), and Pool details All-time / Tour standings (#148) can't drift
 * apart.
 *
 * Core scoring is frozen (see `src/shared/utils/scoring.js` and
 * `functions/index.js::calculateSlotScore`). This module only aggregates
 * already-computed per-pick scores.
 */

/**
 * A pick row as stored in Firestore `picks/{showDate}_{uid}` (or any
 * normalized superset). Extra fields are passed through untouched by the
 * aggregation helpers.
 *
 * @typedef {Object} PickLike
 * @property {unknown} [picks]     Map of slot → song string.
 * @property {boolean} [isGraded]  Finalize/rollup flag; required for season credit.
 * @property {number} [score]      Computed total score (per-night).
 */

/**
 * Whether a `picks` map has at least one non-empty song string.
 *
 * @param {unknown} picks
 * @returns {boolean}
 */
export function hasNonEmptyPicksObject(picks) {
  if (picks == null || typeof picks !== 'object' || Array.isArray(picks)) {
    return false;
  }
  return Object.values(picks).some(
    (v) => v != null && String(v).trim() !== ''
  );
}

/**
 * Whether a pick document is eligible to count toward any season-style
 * aggregate (totals, wins, shows). Requires finalize/rollup (`isGraded`) and
 * at least one non-empty pick.
 *
 * Intentionally does NOT check pool membership — pool-scoped callers layer
 * their own membership filter on top (see `pickDataCountsForPool`).
 *
 * @param {PickLike | null | undefined} pickData
 * @returns {boolean}
 */
export function pickCountsTowardSeason(pickData) {
  if (!pickData || pickData.isGraded !== true) return false;
  return hasNonEmptyPicksObject(pickData.picks);
}

/**
 * Reduce a list of pick rows (one show, any scope — global or pool-scoped)
 * down to the "overall winner(s) of the night" shape.
 *
 * Callers are expected to pre-filter to the rows they care about (e.g. all
 * picks from `picks where showDate == X`, or just pool members' picks).
 * This function applies the shared eligibility rule and tie logic.
 *
 * @template {PickLike} T
 * @param {Iterable<T>} pickList
 * @returns {{ max: number | null, winners: T[] }}
 *   `max` is `null` when nobody is eligible or when the top score is `0`
 *   (nobody is credited a win). `winners` is the subset tied at `max`, in
 *   the same order they appeared in `pickList`.
 */
export function reduceShowWinners(pickList) {
  let max = null;
  /** @type {T[]} */
  const eligible = [];
  for (const row of pickList) {
    if (!pickCountsTowardSeason(row)) continue;
    eligible.push(row);
    const score = typeof row.score === 'number' ? row.score : 0;
    if (max === null || score > max) max = score;
  }
  if (max === null || max <= 0) {
    return { max: null, winners: [] };
  }
  const winners = eligible.filter(
    (row) => (typeof row.score === 'number' ? row.score : 0) === max
  );
  return { max, winners };
}
