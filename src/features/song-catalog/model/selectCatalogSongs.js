import { PHISH_SONGS } from '../../../shared/data/phishSongs.js';

/**
 * Catalog Last is last-played (YYYY-MM-DD). Accept `last_played` / ISO timestamps
 * so a payload-shape drift cannot show Never or a clipped datetime.
 *
 * @param {unknown} raw
 * @returns {string | undefined}
 */
export function normalizeCatalogLastDate(raw) {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') return undefined;
  const ymd = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return ymd ? ymd[1] : trimmed;
}

/**
 * @param {Record<string, unknown>} song
 * @returns {string | undefined}
 */
function lastFromSongFields(song) {
  return (
    normalizeCatalogLastDate(song.last) ||
    normalizeCatalogLastDate(song.last_played) ||
    normalizeCatalogLastDate(song.lastPlayed)
  );
}

/**
 * @param {unknown} song
 * @returns {{ name: string, total?: string, gap?: string, last?: string, debut?: string }}
 */
export function normalizeCatalogSong(song) {
  const rec = song && typeof song === 'object' ? /** @type {Record<string, unknown>} */ (song) : {};
  const last = lastFromSongFields(rec);
  if (last === rec.last) return /** @type {{ name: string }} */ (rec);
  return { ...rec, last: last ?? rec.last };
}

/**
 * @param {unknown} remoteSongs
 * @param {{ name: string }[]} [fallbackSongs]
 * @returns {{ songs: { name: string, total?: string, gap?: string, last?: string, debut?: string }[], source: 'cdn' | 'fallback' }}
 */
export function selectCatalogSongs(remoteSongs, fallbackSongs = PHISH_SONGS) {
  if (Array.isArray(remoteSongs) && remoteSongs.length > 0) {
    return {
      songs: remoteSongs.map(normalizeCatalogSong),
      source: 'cdn',
    };
  }
  return { songs: fallbackSongs, source: 'fallback' };
}
