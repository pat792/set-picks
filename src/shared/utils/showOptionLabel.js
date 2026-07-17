const cityFromVenue = (venue) => venue.split(',')[0].trim();

/**
 * Full line for desktop <option>s and in-page cards/banners (Active Show,
 * standings headers, etc.). No hard character truncate — CSS wrap/truncate
 * at the call site when the surface is narrow.
 */
export function showOptionLabelDesktop(show) {
  return `${show.date} — ${cityFromVenue(show.venue)}`;
}

/**
 * Short single-line label for narrow / mobile <option> lists only.
 * Native pickers often wrap long text; truncation keeps one line per show.
 * Do not use for roomy card titles — prefer {@link showOptionLabelDesktop}.
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
