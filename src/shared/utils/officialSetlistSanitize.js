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
