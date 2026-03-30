const cityFromVenue = (venue) => venue.split(',')[0].trim();

/** Full line for desktop <option> (wider menu). */
export function showOptionLabelDesktop(show) {
  return `${show.date} — ${cityFromVenue(show.venue)}`;
}

/**
 * Short single-line label for narrow / mobile <option> lists.
 * Native pickers often wrap long text; truncation keeps one line per show.
 */
export function showOptionLabelCompact(show, maxChars = 40) {
  const base = `${show.date} ${cityFromVenue(show.venue)}`;
  if (base.length <= maxChars) return base;
  return `${base.slice(0, maxChars - 1)}…`;
}

/** Tooltip / accessible hint with full venue. */
export function showOptionTitle(show) {
  return `${show.date} — ${show.venue}`;
}
