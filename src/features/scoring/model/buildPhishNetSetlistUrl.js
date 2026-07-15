/**
 * Public Phish.net setlist page for a show date (YYYY-MM-DD).
 * `?d=` redirects to the slug URL; safe without venue slug on our side.
 *
 * @param {string} showDate
 * @returns {string}
 */
export function buildPhishNetSetlistUrl(showDate) {
  const d = String(showDate ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return 'https://phish.net';
  }
  return `https://phish.net/setlists/?d=${encodeURIComponent(d)}`;
}
