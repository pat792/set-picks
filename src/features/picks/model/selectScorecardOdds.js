import { FORM_FIELDS } from '../../../shared/data/gameConfig';

import { normalizePickTitle } from './groupPickRecommendations';

/**
 * Optional slot odds from Storage `pick-recommendations.json` (`playProb`).
 * Same artifact as Lab / `usePickRecommendations`. Never computes live crowd %.
 * Returns null when the artifact is missing, for another night, or has no
 * matching rows — callers omit the odds row.
 *
 * @param {object | null | undefined} artifact
 * @param {string | null | undefined} selectedDate
 * @param {Record<string, unknown> | null | undefined} selfPayload
 * @returns {{ fieldId: string, label: string, song: string, playProb: number }[] | null}
 */
export function selectScorecardOdds(artifact, selectedDate, selfPayload) {
  if (!artifact || typeof artifact !== 'object') return null;
  const targetDate =
    typeof artifact.targetShow?.date === 'string' ? artifact.targetShow.date : '';
  if (!selectedDate || !targetDate || selectedDate !== targetDate) return null;
  if (!artifact.slots || typeof artifact.slots !== 'object') return null;

  /** @type {{ fieldId: string, label: string, song: string, playProb: number }[]} */
  const matched = [];

  for (const field of FORM_FIELDS) {
    const song = String(selfPayload?.[field.id] ?? '').trim();
    const key = normalizePickTitle(song);
    if (!key) continue;

    const slotRows = artifact.slots[field.id];
    if (!Array.isArray(slotRows)) continue;

    const row = slotRows.find((item) => {
      if (!item || typeof item !== 'object') return false;
      const itemKey =
        normalizePickTitle(item.normalizedName) || normalizePickTitle(item.name);
      return itemKey === key;
    });

    if (typeof row?.playProb === 'number' && Number.isFinite(row.playProb)) {
      matched.push({
        fieldId: field.id,
        label: field.label,
        song,
        playProb: row.playProb,
      });
    }
  }

  return matched.length > 0 ? matched : null;
}

/**
 * @param {number} playProb
 * @returns {string | null}
 */
export function formatOddsPercent(playProb) {
  if (typeof playProb !== 'number' || !Number.isFinite(playProb)) return null;
  const pct = Math.round(Math.max(0, Math.min(1, playProb)) * 100);
  return `${pct}%`;
}
