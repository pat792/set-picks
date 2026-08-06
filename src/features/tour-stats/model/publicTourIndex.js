/**
 * Public tour-stats index helpers (#665) — current tour = newest lastShowDate.
 */

/**
 * @param {{ tourSlug?: string, tourLabel?: string, lastShowDate?: string | null }} a
 * @param {{ tourSlug?: string, tourLabel?: string, lastShowDate?: string | null }} b
 * @returns {number}
 */
export function comparePublicTourIndexEntries(a, b) {
  const la = typeof a?.lastShowDate === 'string' ? a.lastShowDate : '';
  const lb = typeof b?.lastShowDate === 'string' ? b.lastShowDate : '';
  if (lb !== la) return lb > la ? 1 : -1;
  return String(a?.tourLabel || a?.tourSlug || '').localeCompare(
    String(b?.tourLabel || b?.tourSlug || ''),
  );
}

/**
 * @param {Array<{ tourSlug?: string, tourLabel?: string, lastShowDate?: string | null }>} tours
 * @returns {Array<{ tourSlug: string, tourLabel?: string, lastShowDate?: string | null }>}
 */
export function sortPublicTourIndex(tours) {
  const list = Array.isArray(tours)
    ? tours.filter((t) => t && typeof t.tourSlug === 'string' && t.tourSlug.trim())
    : [];
  return [...list].sort(comparePublicTourIndexEntries);
}

/**
 * Current / most-recent tour for the public filter default.
 * Prefers newest `lastShowDate`; falls back to `preferredSlug` only when dates
 * are missing and that slug is in the list.
 *
 * @param {Array<{ tourSlug?: string, tourLabel?: string, lastShowDate?: string | null }>} tours
 * @param {string} [preferredSlug]
 * @returns {string}
 */
export function resolveDefaultPublicTourSlug(tours, preferredSlug = '') {
  const sorted = sortPublicTourIndex(tours);
  if (sorted.length === 0) return '';

  const hasAnyDate = sorted.some(
    (t) => typeof t.lastShowDate === 'string' && t.lastShowDate.trim(),
  );
  if (hasAnyDate) {
    return sorted[0].tourSlug;
  }

  const preferred = String(preferredSlug ?? '').trim();
  if (preferred && sorted.some((t) => t.tourSlug === preferred)) {
    return preferred;
  }
  return sorted[0].tourSlug;
}
