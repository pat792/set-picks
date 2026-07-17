/**
 * Profile averages derived from existing season / career stats (#554).
 * Avg points needs no extra Firestore reads — only totalPoints / shows.
 */

/**
 * @param {{ totalPoints?: unknown, shows?: unknown } | null | undefined} stats
 * @returns {number | null} Mean points per graded show, or null when undefined
 */
export function computeAvgPointsPerShow(stats) {
  const totalPoints =
    typeof stats?.totalPoints === 'number' && Number.isFinite(stats.totalPoints)
      ? stats.totalPoints
      : null;
  const shows =
    typeof stats?.shows === 'number' && Number.isFinite(stats.shows)
      ? stats.shows
      : null;
  if (totalPoints == null || shows == null || shows <= 0) return null;
  return totalPoints / shows;
}

/**
 * Display helper — one decimal when needed, otherwise integer string.
 *
 * @param {number | null | undefined} avg
 * @returns {string}
 */
export function formatAvgPointsPerShow(avg) {
  if (typeof avg !== 'number' || !Number.isFinite(avg)) return '—';
  const rounded = Math.round(avg * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
