import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import { hasNonEmptyPicksObject } from '../../../shared/utils/showAggregation';

const SLOT_IDS = FORM_FIELDS.map((f) => f.id);

/**
 * @typedef {{
 *   title: string,
 *   cardCount: number,
 *   slotFills: number,
 *   pctOfPickers: number,
 * }} CrowdNightSongRow
 */

/**
 * @typedef {{
 *   showDate: string,
 *   pickers: number,
 *   uniqueSongs: number,
 *   songs: CrowdNightSongRow[],
 *   multiPickerSongs: CrowdNightSongRow[],
 *   submittedDocs: Array<Record<string, unknown>>,
 * }} CrowdNightSongStats
 */

/**
 * @param {unknown} raw
 * @returns {string}
 */
function normalizeTitle(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim();
}

/**
 * Aggregate submitted pick docs for one show night (C1 / #690).
 *
 * - `songs`: all unique titles, ranked by cardCount then slotFills
 * - `multiPickerSongs`: cardCount ≥ 2 (card summary / top picks)
 *
 * @param {string} showDate
 * @param {Array<Record<string, unknown>> | null | undefined} pickDocs
 * @returns {CrowdNightSongStats}
 */
export function aggregateCrowdNightSongs(showDate, pickDocs) {
  const list = Array.isArray(pickDocs) ? pickDocs : [];
  /** @type {Array<Record<string, unknown>>} */
  const submitted = [];
  for (const doc of list) {
    if (!hasNonEmptyPicksObject(doc?.picks)) continue;
    submitted.push(doc);
  }

  const pickers = submitted.length;
  /** @type {Map<string, { title: string, cardCount: number, slotFills: number }>} */
  const byKey = new Map();

  for (const doc of submitted) {
    const slots =
      doc.picks && typeof doc.picks === 'object' && !Array.isArray(doc.picks)
        ? doc.picks
        : {};
    /** @type {Set<string>} */
    const seenOnCard = new Set();
    for (const slotId of SLOT_IDS) {
      const title = normalizeTitle(slots[slotId]);
      if (!title) continue;
      const key = title.toLowerCase();
      let row = byKey.get(key);
      if (!row) {
        row = { title, cardCount: 0, slotFills: 0 };
        byKey.set(key, row);
      }
      row.slotFills += 1;
      if (!seenOnCard.has(key)) {
        seenOnCard.add(key);
        row.cardCount += 1;
      }
    }
  }

  const denom = pickers > 0 ? pickers : 1;
  const songs = [...byKey.values()]
    .sort(
      (a, b) =>
        b.cardCount - a.cardCount ||
        b.slotFills - a.slotFills ||
        a.title.localeCompare(b.title)
    )
    .map((row) => ({
      title: row.title,
      cardCount: row.cardCount,
      slotFills: row.slotFills,
      pctOfPickers: Math.round((1000 * row.cardCount) / denom) / 10,
    }));

  return {
    showDate: typeof showDate === 'string' ? showDate : '',
    pickers,
    uniqueSongs: songs.length,
    songs,
    multiPickerSongs: songs.filter((s) => s.cardCount >= 2),
    submittedDocs: submitted,
  };
}

/**
 * Card v1 summary slice from C1 stats.
 *
 * @param {CrowdNightSongStats} stats
 * @param {{ topN?: number }} [options]
 */
export function crowdNightCardSummary(stats, options = {}) {
  const topN =
    typeof options.topN === 'number' && options.topN > 0
      ? Math.trunc(options.topN)
      : 3;
  return {
    pickers: stats.pickers,
    uniqueSongs: stats.uniqueSongs,
    topMulti: stats.multiPickerSongs.slice(0, topN).map((s) => ({
      title: s.title,
      cardCount: s.cardCount,
      pctOfPickers: s.pctOfPickers,
    })),
  };
}
