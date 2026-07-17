/**
 * Pure tour-level aggregation over normalized `official_setlists` docs (#555).
 * Display / explorer only — not used for scoring.
 */

/**
 * @param {unknown} title
 * @returns {string}
 */
function normalizeTitle(title) {
  return String(title ?? '')
    .trim()
    .toLowerCase();
}

/**
 * @typedef {{
 *   title: string,
 *   timesPlayed: number,
 *   showDates: string[],
 * }} TourSongFrequencyRow
 *
 * @typedef {{
 *   title: string,
 *   showDate: string,
 *   gap: number | null,
 * }} TourBustoutRow
 *
 * @typedef {{
 *   title: string,
 *   showDate: string,
 *   gap: number,
 * }} TourGapHighlightRow
 *
 * @typedef {{
 *   tourShowCount: number,
 *   showsWithSetlist: number,
 *   uniqueSongs: number,
 *   totalSongPlays: number,
 *   topSongs: TourSongFrequencyRow[],
 *   bustouts: TourBustoutRow[],
 *   gapHighlights: TourGapHighlightRow[],
 * }} TourSetlistStats
 */

export const TOUR_STATS_TOP_N = 15;
/** Surface high-gap non-bustout songs in the explorer (≥ this gap). */
export const TOUR_STATS_GAP_HIGHLIGHT_MIN = 20;

/**
 * @param {Array<{
 *   showDate: string,
 *   setlist: null | Record<string, unknown>,
 * }>} docs
 * @param {{
 *   tourShowCount?: number,
 *   topN?: number,
 *   gapHighlightMin?: number,
 * }} [options]
 * @returns {TourSetlistStats}
 */
export function aggregateTourSetlistStats(docs, options = {}) {
  const topN =
    typeof options.topN === 'number' && options.topN > 0
      ? Math.trunc(options.topN)
      : TOUR_STATS_TOP_N;
  const gapHighlightMin =
    typeof options.gapHighlightMin === 'number' && options.gapHighlightMin >= 0
      ? Math.trunc(options.gapHighlightMin)
      : TOUR_STATS_GAP_HIGHLIGHT_MIN;
  const tourShowCount =
    typeof options.tourShowCount === 'number' && options.tourShowCount >= 0
      ? Math.trunc(options.tourShowCount)
      : Array.isArray(docs)
        ? docs.length
        : 0;

  /** @type {Map<string, { title: string, timesPlayed: number, showDates: string[] }>} */
  const bySong = new Map();
  /** @type {TourBustoutRow[]} */
  const bustouts = [];
  /** @type {TourGapHighlightRow[]} */
  const gapHighlights = [];
  let showsWithSetlist = 0;
  let totalSongPlays = 0;

  const list = Array.isArray(docs) ? docs : [];
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue;
    const showDate = typeof entry.showDate === 'string' ? entry.showDate.trim() : '';
    const setlist = entry.setlist;
    if (!setlist || typeof setlist !== 'object') continue;

    const titles = Array.isArray(setlist.officialSetlist)
      ? setlist.officialSetlist.map((t) => String(t ?? '').trim()).filter(Boolean)
      : [];
    if (titles.length === 0) continue;
    showsWithSetlist += 1;

    const seenThisShow = new Set();
    for (const title of titles) {
      const key = normalizeTitle(title);
      if (!key || seenThisShow.has(key)) continue;
      seenThisShow.add(key);
      totalSongPlays += 1;
      const existing = bySong.get(key);
      if (existing) {
        existing.timesPlayed += 1;
        if (showDate) existing.showDates.push(showDate);
      } else {
        bySong.set(key, {
          title,
          timesPlayed: 1,
          showDates: showDate ? [showDate] : [],
        });
      }
    }

    const bustoutList = Array.isArray(setlist.bustouts) ? setlist.bustouts : [];
    const bustoutKeys = new Set();
    for (const raw of bustoutList) {
      const title = String(raw ?? '').trim();
      const key = normalizeTitle(title);
      if (!title || !key || bustoutKeys.has(key)) continue;
      bustoutKeys.add(key);
      const gaps = setlist.songGaps;
      const gapRaw =
        gaps && typeof gaps === 'object' && !Array.isArray(gaps) ? gaps[key] : null;
      const gap =
        typeof gapRaw === 'number' && Number.isFinite(gapRaw)
          ? Math.trunc(gapRaw)
          : null;
      bustouts.push({ title, showDate, gap });
    }

    const gaps = setlist.songGaps;
    if (gaps && typeof gaps === 'object' && !Array.isArray(gaps)) {
      for (const [key, gapRaw] of Object.entries(gaps)) {
        const gap =
          typeof gapRaw === 'number' && Number.isFinite(gapRaw)
            ? Math.trunc(gapRaw)
            : null;
        if (gap == null || gap < gapHighlightMin) continue;
        if (bustoutKeys.has(key)) continue;
        const match = bySong.get(key);
        const title = match?.title || key;
        gapHighlights.push({ title, showDate, gap });
      }
    }
  }

  const topSongs = [...bySong.values()]
    .sort((a, b) => {
      if (b.timesPlayed !== a.timesPlayed) return b.timesPlayed - a.timesPlayed;
      return a.title.localeCompare(b.title);
    })
    .slice(0, topN)
    .map((row) => ({
      title: row.title,
      timesPlayed: row.timesPlayed,
      showDates: [...row.showDates],
    }));

  bustouts.sort((a, b) => {
    const ga = a.gap ?? -1;
    const gb = b.gap ?? -1;
    if (gb !== ga) return gb - ga;
    return a.title.localeCompare(b.title);
  });

  gapHighlights.sort((a, b) => {
    if (b.gap !== a.gap) return b.gap - a.gap;
    return a.title.localeCompare(b.title);
  });

  return {
    tourShowCount,
    showsWithSetlist,
    uniqueSongs: bySong.size,
    totalSongPlays,
    topSongs,
    bustouts,
    gapHighlights: gapHighlights.slice(0, topN),
  };
}
