import { GAME_LAUNCH_SHOW_DATE } from '../../../shared/config/gameLaunch';

/**
 * @typedef {{ tour: string, shows: Array<{ date: string, venue?: string }> }} TourGroup
 */

/**
 * Filter `showDatesByTour` to tours that have at least one show on or after
 * {@link GAME_LAUNCH_SHOW_DATE} and on or before `today`, then sort newest
 * last-show-date first so the current (most recent) tour leads the list.
 *
 * Used by the "Past tours" picker (#295) to populate the tour selector on
 * both the global standings Tour view and the pool hub standings section.
 *
 * @param {TourGroup[] | null | undefined} showDatesByTour
 * @param {string} today - YYYY-MM-DD lexicographic comparison
 * @returns {TourGroup[]}
 */
export function resolveSelectableTours(showDatesByTour, today) {
  if (!Array.isArray(showDatesByTour) || !today) return [];

  /** @type {Array<{ group: TourGroup, lastDate: string }>} */
  const scored = [];
  for (const group of showDatesByTour) {
    if (!group || !Array.isArray(group.shows)) continue;
    const eligible = group.shows.filter(
      (s) =>
        typeof s.date === 'string' &&
        s.date >= GAME_LAUNCH_SHOW_DATE &&
        s.date <= today,
    );
    if (eligible.length === 0) continue;
    const lastDate = eligible.reduce((a, b) => (a.date > b.date ? a : b)).date;
    scored.push({ group, lastDate });
  }

  scored.sort((a, b) => (a.lastDate > b.lastDate ? -1 : 1));
  return scored.map((r) => r.group);
}

/**
 * Look up a tour from `showDatesByTour` by its `tour` name/key. Trims
 * whitespace on both sides (normalization fallback) so minor differences
 * don't cause a miss.
 *
 * @param {TourGroup[] | null | undefined} showDatesByTour
 * @param {string | null | undefined} tourKey
 * @returns {TourGroup | null}
 */
export function getTourByKey(showDatesByTour, tourKey) {
  if (!Array.isArray(showDatesByTour) || typeof tourKey !== 'string') return null;
  const key = tourKey.trim();
  if (!key) return null;
  return (
    showDatesByTour.find(
      (g) => g && typeof g.tour === 'string' && g.tour.trim() === key,
    ) ?? null
  );
}
