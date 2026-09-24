import { FORM_FIELDS } from '../../../shared/data/gameConfig';

import { normalizePickTitle } from './groupPickRecommendations';
import { getScorecardPickPayload } from './scorecardPickPayload';

/**
 * Per-slot overlap against show-scoped standings rows already loaded by
 * `useStandings`. Counts other players who picked the same song in the same
 * slot. Does not scan other shows.
 *
 * @param {Array<Record<string, unknown>> | null | undefined} displayedPicks
 * @param {string | null | undefined} selfUserId
 * @param {Record<string, unknown> | null | undefined} selfPayload
 * @returns {{ fieldId: string, label: string, song: string, alsoPickedCount: number }[]}
 */
export function computeScorecardOverlap(displayedPicks, selfUserId, selfPayload) {
  const others = Array.isArray(displayedPicks)
    ? displayedPicks.filter((entry) => (entry?.userId || entry?.uid) !== selfUserId)
    : [];

  return FORM_FIELDS.map((field) => {
    const song = String(selfPayload?.[field.id] ?? '').trim();
    const key = normalizePickTitle(song);
    if (!key) {
      return {
        fieldId: field.id,
        label: field.label,
        song: '',
        alsoPickedCount: 0,
      };
    }

    let alsoPickedCount = 0;
    for (const entry of others) {
      const payload = getScorecardPickPayload(entry);
      if (normalizePickTitle(payload[field.id]) === key) {
        alsoPickedCount += 1;
      }
    }

    return {
      fieldId: field.id,
      label: field.label,
      song,
      alsoPickedCount,
    };
  });
}

/**
 * @param {number} count
 * @returns {string}
 */
export function formatOverlapLabel(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return 'Nobody else picked this';
  if (n === 1) return '1 player also picked this';
  return `${n} players also picked this`;
}
