/**
 * Normalized titles played on a night from `official_setlists` payload.
 * Mirrors scoring’s “anywhere in the show” set: slot strings + ordered
 * `officialSetlist` (LIVE polls grow this list in real time).
 *
 * @param {Record<string, unknown> | null | undefined} actualSetlist
 * @returns {Set<string>} lowercased trimmed titles
 */
export function buildOfficialPlayedTitleSet(actualSetlist) {
  /** @type {Set<string>} */
  const out = new Set();
  if (!actualSetlist || typeof actualSetlist !== 'object') return out;

  const NON_SONG_KEYS = new Set([
    'officialSetlist',
    'encoreSongs',
    'id',
    'bustouts',
    'songGaps',
  ]);

  for (const [key, val] of Object.entries(actualSetlist)) {
    if (NON_SONG_KEYS.has(key)) continue;
    if (typeof val !== 'string') continue;
    const t = val.trim().toLowerCase();
    if (t) out.add(t);
  }

  const rawOfficial = actualSetlist.officialSetlist;
  if (Array.isArray(rawOfficial)) {
    for (const raw of rawOfficial) {
      const t =
        typeof raw === 'string'
          ? raw.trim().toLowerCase()
          : String(raw ?? '')
              .trim()
              .toLowerCase();
      if (t) out.add(t);
    }
  }

  const encoreSongs = actualSetlist.encoreSongs;
  if (Array.isArray(encoreSongs)) {
    for (const raw of encoreSongs) {
      const t =
        typeof raw === 'string'
          ? raw.trim().toLowerCase()
          : String(raw ?? '')
              .trim()
              .toLowerCase();
      if (t) out.add(t);
    }
  }

  return out;
}

/**
 * @param {string | null | undefined} title
 * @param {Set<string> | null | undefined} playedTitles
 */
export function isCrowdSongPlayed(title, playedTitles) {
  if (!(playedTitles instanceof Set) || playedTitles.size === 0) return false;
  const key = typeof title === 'string' ? title.trim().toLowerCase() : '';
  return Boolean(key) && playedTitles.has(key);
}
