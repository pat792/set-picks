import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import { resolveCatalogSongTitle } from '../../../shared/lib/resolveCatalogSongTitle';

/**
 * @param {Record<string, unknown>} formData
 * @param {Array<string | { name?: string }>} songs
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validatePicksForSave(formData, songs) {
  const used = new Set();
  for (const f of FORM_FIELDS) {
    const raw = formData?.[f.id];
    if (raw == null || !String(raw).trim()) continue;
    const canonical = resolveCatalogSongTitle(raw, songs);
    if (canonical === null) {
      return {
        ok: false,
        message: 'Every filled pick must be a song from the catalog.',
      };
    }
    const key = canonical.toLowerCase();
    if (used.has(key)) {
      return {
        ok: false,
        message: 'Each pick must be a different song.',
      };
    }
    used.add(key);
  }
  return { ok: true };
}
