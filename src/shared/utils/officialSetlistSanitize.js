/**
 * Pure helpers for official setlist slot maps and ordered song lists.
 * Used by admin Firestore I/O and setlist automation (#142).
 */

const normalizeSong = (value) => String(value ?? '').trim();

export function sanitizeSetlistSlots(setlistData, slotFields) {
  const cleaned = {};
  slotFields.forEach((field) => {
    const value = setlistData?.[field.id];
    cleaned[field.id] = typeof value === 'string' ? value.trim() : normalizeSong(value);
  });
  return cleaned;
}

export function sanitizeOfficialSongList(officialSetlist) {
  if (!Array.isArray(officialSetlist)) return [];
  return officialSetlist.map(normalizeSong).filter(Boolean);
}

/**
 * Normalize a per-show `bustouts` list for persistence and scoring: trim,
 * drop empties, dedupe by lowercase form (preserving first-seen casing).
 * Source of truth for scoring bustout boosts post-#214.
 *
 * @param {unknown} input
 * @returns {string[]}
 */
export function sanitizeBustouts(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of input) {
    const title = typeof raw === 'string' ? raw.trim() : '';
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(title);
  }
  return out;
}
