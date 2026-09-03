import { FORM_FIELDS } from '../../../shared/data/gameConfig';

/**
 * Slot payload from a standings pick row (nested `picks` or flat legacy fields).
 *
 * @param {Record<string, unknown> | null | undefined} pickEntry
 * @returns {Record<string, string>}
 */
export function getScorecardPickPayload(pickEntry) {
  if (pickEntry?.picks && typeof pickEntry.picks === 'object') {
    return /** @type {Record<string, string>} */ (pickEntry.picks);
  }

  return FORM_FIELDS.reduce((acc, field) => {
    const raw = pickEntry?.[field.id];
    acc[field.id] = raw == null ? '' : String(raw);
    return acc;
  }, /** @type {Record<string, string>} */ ({}));
}
