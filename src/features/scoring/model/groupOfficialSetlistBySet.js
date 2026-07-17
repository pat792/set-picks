/**
 * Group a normalized `official_setlists` payload into Set 1 / Set 2 / Encore
 * for fan-facing standings display (#552).
 *
 * Firestore stores a flat `officialSetlist` (all titles in play order) plus
 * slot markers and optional `encoreSongs`. Set breaks are inferred from
 * `s2o` and encore markers — imperfect mid-show until those land.
 *
 * @param {null | Record<string, unknown>} actualSetlist — from
 *   `normalizeOfficialSetlistDocData` / `useStandings`
 * @returns {{
 *   set1: string[],
 *   set2: string[],
 *   encore: string[],
 *   hasSongs: boolean,
 *   hasOfficialSlots: boolean,
 * }}
 */
export function groupOfficialSetlistBySet(actualSetlist) {
  if (!actualSetlist || typeof actualSetlist !== 'object') {
    return {
      set1: [],
      set2: [],
      encore: [],
      hasSongs: false,
      hasOfficialSlots: false,
    };
  }

  const list = Array.isArray(actualSetlist.officialSetlist)
    ? actualSetlist.officialSetlist
        .map((t) => String(t ?? '').trim())
        .filter(Boolean)
    : [];

  const encoreSongs = Array.isArray(actualSetlist.encoreSongs)
    ? actualSetlist.encoreSongs
        .map((t) => String(t ?? '').trim())
        .filter(Boolean)
    : [];

  const s2o = String(actualSetlist.s2o ?? '').trim();
  const enc = String(actualSetlist.enc ?? '').trim();

  const lowerEq = (a, b) => a.toLowerCase() === b.toLowerCase();

  let mainList = list;
  let encoreFromList = [];

  if (encoreSongs.length > 0) {
    const firstEncIdx = list.findIndex((t) => lowerEq(t, encoreSongs[0]));
    if (firstEncIdx >= 0) {
      mainList = list.slice(0, firstEncIdx);
      encoreFromList = list.slice(firstEncIdx);
    }
  } else if (enc) {
    const encIdx = list.findIndex((t) => lowerEq(t, enc));
    if (encIdx >= 0) {
      mainList = list.slice(0, encIdx);
      encoreFromList = list.slice(encIdx);
    }
  }

  const encore = encoreSongs.length > 0 ? encoreSongs : encoreFromList;

  let set1 = [];
  let set2 = [];
  if (s2o) {
    const s2Idx = mainList.findIndex((t) => lowerEq(t, s2o));
    if (s2Idx >= 0) {
      set1 = mainList.slice(0, s2Idx);
      set2 = mainList.slice(s2Idx);
    } else {
      set1 = mainList;
    }
  } else {
    set1 = mainList;
  }

  const hasSongs = set1.length + set2.length + encore.length > 0;
  const slotIds = ['s1o', 's1c', 's2o', 's2c', 'enc'];
  const hasOfficialSlots = slotIds.some(
    (id) => String(actualSetlist[id] ?? '').trim().length > 0,
  );

  return { set1, set2, encore, hasSongs, hasOfficialSlots };
}

/**
 * @param {unknown} title
 * @returns {string}
 */
function normalizeOfficialTitle(title) {
  return String(title ?? '')
    .trim()
    .toLowerCase();
}

/**
 * Builds the per-show bustout title lookup used by Standings setlist rows.
 * `official_setlists.bustouts` is already the scoring source of truth; this
 * helper only normalizes display matching.
 *
 * @param {null | Record<string, unknown>} actualSetlist
 * @returns {Set<string>}
 */
export function buildBustoutTitleSet(actualSetlist) {
  if (!actualSetlist || typeof actualSetlist !== 'object') return new Set();
  if (!Array.isArray(actualSetlist.bustouts)) return new Set();
  return new Set(actualSetlist.bustouts.map(normalizeOfficialTitle).filter(Boolean));
}

/**
 * @param {unknown} title
 * @param {Set<string>} bustoutTitleSet
 * @returns {boolean}
 */
export function isOfficialSetlistBustout(title, bustoutTitleSet) {
  if (!(bustoutTitleSet instanceof Set) || bustoutTitleSet.size === 0) return false;
  return bustoutTitleSet.has(normalizeOfficialTitle(title));
}
