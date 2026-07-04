import { FORM_FIELDS } from '../../../shared/data/gameConfig';

export function hasNonEmptyPicksObject(picks) {
  if (picks == null || typeof picks !== 'object' || Array.isArray(picks)) {
    return false;
  }
  return Object.values(picks).some(
    (v) => v != null && String(v).trim() !== ''
  );
}

/** Whether a picks query row (or flat legacy doc) counts as submitted. */
export function pickEntryHasSubmission(entry) {
  if (!entry || typeof entry !== 'object') return false;
  if (entry.picks && typeof entry.picks === 'object') {
    return hasNonEmptyPicksObject(entry.picks);
  }
  return FORM_FIELDS.some((f) => {
    const v = entry[f.id];
    return v != null && String(v).trim() !== '';
  });
}

/**
 * @param {Array<{ userId?: string, uid?: string } & Record<string, unknown>> | null | undefined} pickEntries
 * @param {string | null | undefined} userId
 */
export function userHasSubmittedPickEntry(pickEntries, userId) {
  if (!userId || !Array.isArray(pickEntries)) return false;
  const entry = pickEntries.find((p) => (p.userId || p.uid) === userId);
  return pickEntryHasSubmission(entry);
}
