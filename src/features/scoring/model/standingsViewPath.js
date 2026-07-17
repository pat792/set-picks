/**
 * Path helpers for Standings IA views (#255 / #555).
 *
 * Stats lives on `/dashboard/tour-stats` (dedicated route); Show / Tour / Pools
 * stay on `/dashboard/standings` with `?view=`. Tour scope (`?tour=`) is shared.
 */

/** @typedef {'show' | 'tour' | 'pools' | 'stats'} StandingsViewId */

/**
 * @param {StandingsViewId} view
 * @param {{
 *   tourKey?: string | null,
 *   poolId?: string | null,
 * }} [opts]
 * @returns {string}
 */
export function buildStandingsViewPath(view, opts = {}) {
  const tourKey =
    typeof opts.tourKey === 'string' && opts.tourKey.trim()
      ? opts.tourKey.trim()
      : '';
  const poolId =
    typeof opts.poolId === 'string' && opts.poolId.trim()
      ? opts.poolId.trim()
      : '';

  if (view === 'stats') {
    const params = new URLSearchParams();
    if (tourKey) params.set('tour', tourKey);
    const q = params.toString();
    return q ? `/dashboard/tour-stats?${q}` : '/dashboard/tour-stats';
  }

  const params = new URLSearchParams();
  if (view === 'tour') {
    params.set('view', 'tour');
    if (tourKey) params.set('tour', tourKey);
  } else if (view === 'pools') {
    params.set('view', 'pools');
    if (poolId) params.set('pool', poolId);
  }
  // `show` omits `?view=` (canonical default).
  const q = params.toString();
  return q ? `/dashboard/standings?${q}` : '/dashboard/standings';
}
