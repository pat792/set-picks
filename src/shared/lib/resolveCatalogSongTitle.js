/**
 * Case-insensitive match of user input to a catalog row; returns canonical `name` or null.
 *
 * @param {unknown} input
 * @param {Array<string | { name?: string }>} songs
 * @returns {string | null}
 */
export function resolveCatalogSongTitle(input, songs) {
  const t = String(input ?? '').trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (!Array.isArray(songs)) return null;
  for (const song of songs) {
    const name =
      typeof song === 'string' ? song : song?.name != null ? String(song.name) : '';
    const n = name.trim();
    if (n && n.toLowerCase() === lower) return n;
  }
  return null;
}
