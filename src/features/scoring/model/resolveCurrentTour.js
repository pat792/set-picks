/**
 * Pick the "current tour" the Tour standings surface (#219) should show.
 *
 * Priority (ticket):
 *   1. The tour containing `selectedDate`, if any.
 *   2. The tour containing `todayYmd`, if any.
 *   3. The most recent tour whose last show date is <= `todayYmd`
 *      (i.e. the most recent tour with any finalized shows).
 *
 * Tours come from `show_calendar.showDatesByTour` (authoritative live data).
 * The static fallback in `FALLBACK_SHOW_DATES_BY_TOUR` is only used when
 * Firestore is unavailable — see `ShowCalendarContext`.
 *
 * @typedef {{ tour: string, shows: Array<{ date: string, venue: string }> }} TourGroup
 *
 * @param {string | null | undefined} selectedDate
 * @param {string} todayYmd
 * @param {TourGroup[]} showDatesByTour
 * @returns {TourGroup | null}
 */
export function resolveCurrentTour(selectedDate, todayYmd, showDatesByTour) {
  if (!Array.isArray(showDatesByTour) || showDatesByTour.length === 0) {
    return null;
  }

  const sel = selectedDate?.trim?.();
  if (sel) {
    const match = showDatesByTour.find((g) =>
      Array.isArray(g.shows) && g.shows.some((s) => s.date === sel)
    );
    if (match) return match;
  }

  if (todayYmd) {
    const match = showDatesByTour.find((g) =>
      Array.isArray(g.shows) && g.shows.some((s) => s.date === todayYmd)
    );
    if (match) return match;
  }

  // Most recent tour with at least one show whose date is on or before today.
  /** @type {{ tour: TourGroup, lastFinalizedDate: string } | null} */
  let best = null;
  for (const tour of showDatesByTour) {
    if (!Array.isArray(tour.shows) || tour.shows.length === 0) continue;
    const finalized = tour.shows
      .map((s) => s.date)
      .filter((d) => typeof d === 'string' && (!todayYmd || d <= todayYmd));
    if (finalized.length === 0) continue;
    const last = finalized.reduce((a, b) => (a > b ? a : b));
    if (!best || last > best.lastFinalizedDate) {
      best = { tour, lastFinalizedDate: last };
    }
  }

  return best ? best.tour : null;
}
