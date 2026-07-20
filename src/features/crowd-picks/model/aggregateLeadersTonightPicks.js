import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import { hasNonEmptyPicksObject } from '../../../shared/utils/showAggregation';

const SLOT_IDS = FORM_FIELDS.map((f) => f.id);
export const LEADERS_TOP_K = 5;

/**
 * @typedef {{ uid: string, handle?: string, totalPoints?: number }} LeaderRow
 */

/**
 * Tour top-K leaders' tonight picks by frequency (C3 / #692).
 *
 * @param {LeaderRow[] | null | undefined} tourLeadersSorted — already sorted desc by points
 * @param {Array<Record<string, unknown>> | null | undefined} tonightPickDocs
 * @param {{ topK?: number }} [options]
 */
export function aggregateLeadersTonightPicks(
  tourLeadersSorted,
  tonightPickDocs,
  options = {}
) {
  const topK =
    typeof options.topK === 'number' && options.topK > 0
      ? Math.trunc(options.topK)
      : LEADERS_TOP_K;

  const leaders = (Array.isArray(tourLeadersSorted) ? tourLeadersSorted : [])
    .slice(0, topK)
    .map((row, i) => ({
      rank: i + 1,
      uid: String(row?.uid || '').trim(),
      handle:
        typeof row?.handle === 'string' && row.handle.trim()
          ? row.handle.trim()
          : 'Anonymous',
      totalPoints:
        typeof row?.totalPoints === 'number' ? row.totalPoints : 0,
    }))
    .filter((r) => r.uid);

  /** @type {Map<string, Record<string, unknown>>} */
  const picksByUid = new Map();
  for (const doc of Array.isArray(tonightPickDocs) ? tonightPickDocs : []) {
    const uid = String(doc?.userId || doc?.uid || '').trim();
    if (!uid || !hasNonEmptyPicksObject(doc?.picks)) continue;
    picksByUid.set(uid, doc);
  }

  /** @type {Map<string, { title: string, cardCount: number, amongLeaders: string[] }>} */
  const bySong = new Map();
  let lockedIn = 0;

  for (const leader of leaders) {
    const doc = picksByUid.get(leader.uid);
    if (!doc) continue;
    lockedIn += 1;
    const slots =
      doc.picks && typeof doc.picks === 'object' && !Array.isArray(doc.picks)
        ? doc.picks
        : {};
    /** @type {Set<string>} */
    const seen = new Set();
    for (const slotId of SLOT_IDS) {
      const raw = slots[slotId];
      if (typeof raw !== 'string' || !raw.trim()) continue;
      const title = raw.trim();
      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      let row = bySong.get(key);
      if (!row) {
        row = { title, cardCount: 0, amongLeaders: [] };
        bySong.set(key, row);
      }
      row.cardCount += 1;
      row.amongLeaders.push(leader.handle);
    }
  }

  const songs = [...bySong.values()].sort(
    (a, b) =>
      b.cardCount - a.cardCount || a.title.localeCompare(b.title)
  );

  return {
    topK,
    leaders,
    lockedIn,
    lockedInLabel: `${lockedIn}/${leaders.length}`,
    songs,
  };
}
