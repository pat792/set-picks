/**
 * @param {unknown} value
 * @returns {number | null}
 */
function parseCatalogStat(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s || s === '—' || s === 'N/A') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {string | { name?: string, total?: string, gap?: string, last?: string }} song
 * @returns {string}
 */
function catalogSongName(song) {
  if (typeof song === 'string') return song;
  return song?.name != null ? String(song.name) : '';
}

/**
 * Sort key for autocomplete: lowest gap first, then most times played.
 *
 * @param {string | { name?: string, total?: string, gap?: string, last?: string }} a
 * @param {string | { name?: string, total?: string, gap?: string, last?: string }} b
 * @returns {number}
 */
export function compareCatalogSongsByGapAndPlays(a, b) {
  const gapA = parseCatalogStat(typeof a === 'string' ? null : a.gap);
  const gapB = parseCatalogStat(typeof b === 'string' ? null : b.gap);
  const gapSortA = gapA ?? Number.POSITIVE_INFINITY;
  const gapSortB = gapB ?? Number.POSITIVE_INFINITY;
  if (gapSortA !== gapSortB) return gapSortA - gapSortB;

  const totalA = parseCatalogStat(typeof a === 'string' ? null : a.total);
  const totalB = parseCatalogStat(typeof b === 'string' ? null : b.total);
  const totalSortA = totalA ?? Number.NEGATIVE_INFINITY;
  const totalSortB = totalB ?? Number.NEGATIVE_INFINITY;
  if (totalSortA !== totalSortB) return totalSortB - totalSortA;

  return catalogSongName(a).localeCompare(catalogSongName(b));
}

/**
 * Substring filter + dedupe by title + rank by gap/total for autocomplete.
 *
 * @param {Array<string | { name?: string, total?: string, gap?: string, last?: string }>} songs
 * @param {string} query
 * @param {{ excludeTitlesLower?: Set<string>, limit?: number }} [opts]
 * @returns {Array<string | { name?: string, total?: string, gap?: string, last?: string }>}
 */
export function rankCatalogSongMatches(songs, query, opts = {}) {
  const { excludeTitlesLower = new Set(), limit = 10 } = opts;
  const q = String(query ?? '').trim().toLowerCase();
  if (!q || !Array.isArray(songs)) return [];

  /** @type {Map<string, string | { name?: string, total?: string, gap?: string, last?: string }>} */
  const bestByName = new Map();

  for (const song of songs) {
    const name = catalogSongName(song);
    const n = name.trim().toLowerCase();
    if (!n || excludeTitlesLower.has(n) || !n.includes(q)) continue;

    const prev = bestByName.get(n);
    if (!prev || compareCatalogSongsByGapAndPlays(song, prev) < 0) {
      bestByName.set(n, song);
    }
  }

  return Array.from(bestByName.values())
    .sort(compareCatalogSongsByGapAndPlays)
    .slice(0, limit);
}
