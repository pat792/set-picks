/**
 * Slot-hit average helpers shared by profile + public tour-stats UI.
 * Kept in `shared` so marketing `/tour-stats` never imports the profile barrel
 * (which pulls Auth/Firebase into the cold graph — #832).
 */

import { FORM_FIELDS } from '../data/gameConfig';

export const PROFILE_SLOTS_PER_SHOW = FORM_FIELDS.length;

/**
 * @param {number | null | undefined} avg — slot-hit ratio in [0, 1]
 * @returns {string}
 */
export function formatAvgCorrectPicksPerShow(avg) {
  if (typeof avg !== 'number' || !Number.isFinite(avg)) return '—';
  const fixed = avg.toFixed(3);
  // Batting-average convention: drop the leading zero (.167), keep 1.000.
  return fixed.startsWith('0.') ? fixed.slice(1) : fixed;
}
