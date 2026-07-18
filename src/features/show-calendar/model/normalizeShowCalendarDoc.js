import { enrichShowWithPicksLock } from '../../../shared/utils/picksLockTime';
import { resolveShowTimeZone } from '../../../shared/utils/showTimeZone';

/**
 * @param {Record<string, unknown>} s
 * @returns {{ date: string, venue: string, timeZone: string, doorsLocal?: string, picksLockLocal?: string, picksLockSource?: string } | null}
 */
function normalizeShowRow(s) {
  if (!s || typeof s !== 'object') return null;
  const date = typeof s.date === 'string' ? s.date.trim() : '';
  const venue = typeof s.venue === 'string' ? s.venue.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !venue) return null;
  /** @type {{ date: string, venue: string, timeZone: string, doorsLocal?: string, picksLockLocal?: string }} */
  const base = {
    date,
    venue,
    timeZone: resolveShowTimeZone(
      /** @type {{ timeZone?: string, timezone?: string, venue: string }} */ (s)
    ),
  };
  if (typeof s.doorsLocal === 'string' && s.doorsLocal.trim()) {
    base.doorsLocal = s.doorsLocal.trim();
  }
  if (typeof s.picksLockLocal === 'string' && s.picksLockLocal.trim()) {
    base.picksLockLocal = s.picksLockLocal.trim();
  }
  return enrichShowWithPicksLock(base);
}

/**
 * Validates Firestore `show_calendar/snapshot` written by Cloud Functions (issue #160).
 * Enriches each show with `doorsLocal` / `picksLockLocal` (#522 doors-based lock).
 * @param {import('firebase/firestore').DocumentData | null | undefined} data
 * @returns {{ showDatesByTour: { tour: string, shows: { date: string, venue: string, timeZone: string, doorsLocal?: string, picksLockLocal?: string }[] }[], showDates: { date: string, venue: string, timeZone: string, doorsLocal?: string, picksLockLocal?: string }[], syncError?: string | null } | null}
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
        const row = normalizeShowRow(/** @type {Record<string, unknown>} */ (s));
        if (!row) return null;
        normShows.push(row);
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
      const row = normalizeShowRow(/** @type {Record<string, unknown>} */ (s));
      if (!row) return null;
      flat.push(row);
    }
    return {
      showDatesByTour: [{ tour: 'Scheduled shows', shows: flat }],
      showDates: flat,
      syncError,
    };
  }

  return null;
}
