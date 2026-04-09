/**
 * Validates Firestore `show_calendar/snapshot` written by Cloud Functions (issue #160).
 * @param {import('firebase/firestore').DocumentData | null | undefined} data
 * @returns {{ showDatesByTour: { tour: string, shows: { date: string, venue: string }[] }[], showDates: { date: string, venue: string }[], syncError?: string | null } | null}
 */
export function normalizeShowCalendarDoc(data) {
  if (!data || typeof data !== 'object') return null;

  const syncError =
    typeof data.syncError === 'string' && data.syncError.trim()
      ? data.syncError.trim()
      : null;

  const byTour = data.showDatesByTour;
  if (Array.isArray(byTour) && byTour.length > 0) {
    const groups = [];
    for (const g of byTour) {
      if (!g || typeof g !== 'object') return null;
      const tour = typeof g.tour === 'string' ? g.tour.trim() : '';
      const shows = g.shows;
      if (!tour || !Array.isArray(shows) || shows.length === 0) return null;
      const normShows = [];
      for (const s of shows) {
        if (!s || typeof s !== 'object') return null;
        const date = typeof s.date === 'string' ? s.date.trim() : '';
        const venue = typeof s.venue === 'string' ? s.venue.trim() : '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !venue) return null;
        normShows.push({ date, venue });
      }
      groups.push({ tour, shows: normShows });
    }
    const flat = groups.flatMap((x) => x.shows);
    return { showDatesByTour: groups, showDates: flat, syncError };
  }

  const flatOnly = data.showDates;
  if (Array.isArray(flatOnly) && flatOnly.length > 0) {
    const flat = [];
    for (const s of flatOnly) {
      if (!s || typeof s !== 'object') return null;
      const date = typeof s.date === 'string' ? s.date.trim() : '';
      const venue = typeof s.venue === 'string' ? s.venue.trim() : '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !venue) return null;
      flat.push({ date, venue });
    }
    return {
      showDatesByTour: [{ tour: 'Scheduled shows', shows: flat }],
      showDates: flat,
      syncError,
    };
  }

  return null;
}
