/**
 * Join `lastPlayed` dates from the precomputed `public_tour_stats` payload
 * onto client-aggregated bustout / high-gap rows (#709 follow-up).
 *
 * The date a song was last played *before* a tour night comes from phish.net
 * song history and is only computable server-side (`refreshPublicTourStats`,
 * #666). The dashboard aggregates setlists client-side, so it borrows the
 * dates from the world-readable public doc for the same tour. Rows match on
 * normalized title + tour show date; anything unmatched stays date-less and
 * the UI hides the column when no row has one.
 */

/**
 * @param {unknown} title
 * @param {unknown} showDate
 * @returns {string}
 */
function rowKey(title, showDate) {
  return `${String(title ?? '')
    .trim()
    .toLowerCase()}|${String(showDate ?? '').trim()}`;
}

/**
 * @param {null | undefined | {
 *   bustouts?: Array<{ title?: string, showDate?: string, lastPlayed?: string | null }>,
 *   gapHighlights?: Array<{ title?: string, showDate?: string, lastPlayed?: string | null }>,
 * }} publicDoc
 * @returns {Map<string, string>} rowKey → `YYYY-MM-DD`
 */
export function buildLastPlayedByRowKey(publicDoc) {
  const map = new Map();
  if (!publicDoc || typeof publicDoc !== 'object') return map;
  for (const list of [publicDoc.bustouts, publicDoc.gapHighlights]) {
    if (!Array.isArray(list)) continue;
    for (const row of list) {
      if (!row || typeof row !== 'object') continue;
      const lastPlayed =
        typeof row.lastPlayed === 'string' ? row.lastPlayed.trim() : '';
      if (!lastPlayed) continue;
      map.set(rowKey(row.title, row.showDate), lastPlayed);
    }
  }
  return map;
}

/**
 * Returns `stats` with `lastPlayed` stamped onto matching bustout /
 * gap-highlight rows. Same object back when the public doc contributes
 * nothing, so memoized consumers don't re-render.
 *
 * @template {{ bustouts: Array<object>, gapHighlights: Array<object> }} S
 * @param {S} stats
 * @param {Parameters<typeof buildLastPlayedByRowKey>[0]} publicDoc
 * @returns {S}
 */
export function mergeLastPlayedIntoStats(stats, publicDoc) {
  const byKey = buildLastPlayedByRowKey(publicDoc);
  if (byKey.size === 0) return stats;

  let changed = false;
  const stamp = (rows) =>
    rows.map((row) => {
      const lastPlayed = byKey.get(rowKey(row.title, row.showDate));
      if (!lastPlayed) return row;
      changed = true;
      return { ...row, lastPlayed };
    });

  const bustouts = stamp(stats.bustouts);
  const gapHighlights = stamp(stats.gapHighlights);
  return changed ? { ...stats, bustouts, gapHighlights } : stats;
}
