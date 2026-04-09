import { PHISH_SONGS } from '../../../shared/data/phishSongs.js';

/**
 * @param {unknown} remoteSongs
 * @param {{ name: string }[]} [fallbackSongs]
 * @returns {{ songs: { name: string, total?: string, gap?: string, last?: string }[], source: 'cdn' | 'fallback' }}
 */
export function selectCatalogSongs(remoteSongs, fallbackSongs = PHISH_SONGS) {
  if (Array.isArray(remoteSongs) && remoteSongs.length > 0) {
    return { songs: /** @type {{ name: string }[]} */ (remoteSongs), source: 'cdn' };
  }
  return { songs: fallbackSongs, source: 'fallback' };
}
