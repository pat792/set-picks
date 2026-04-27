/**
 * The first night gameplay went live (issue #254). The Phish.net
 * `show_calendar` snapshot (issue #160) tracks the upstream tour schedule
 * and includes shows that pre-date this app — those nights have zero
 * graded picks, so iterating them in pool standings / past-show surfaces
 * is pure waste.
 *
 * Floor every "past shows" surface and every per-show fan-out at this
 * date. Update the constant only if we ever import historical pick data
 * predating launch (we won't).
 *
 * YYYY-MM-DD — direct lexicographic comparison with `show.date` strings.
 */
export const GAME_LAUNCH_SHOW_DATE = '2026-04-16';

/**
 * Filter a `show_calendar` show list down to dates on or after the
 * gameplay floor. Cheap (one pass); shape-preserving so callers can keep
 * passing the result wherever they used `showDates` before.
 *
 * @template {{ date?: string }} T
 * @param {Iterable<T> | null | undefined} shows
 * @returns {T[]}
 */
export function floorShowsAtGameLaunch(shows) {
  if (!shows) return [];
  const out = [];
  for (const s of shows) {
    if (!s || typeof s !== 'object') continue;
    const date = typeof s.date === 'string' ? s.date : '';
    if (!date || date < GAME_LAUNCH_SHOW_DATE) continue;
    out.push(s);
  }
  return out;
}
