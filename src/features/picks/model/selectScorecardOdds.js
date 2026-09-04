import { FORM_FIELDS } from '../../../shared/data/gameConfig';

import { normalizePickTitle } from './groupPickRecommendations';

/** Shown when the night’s map exists but the pick is not in history. */
export const SCORECARD_ODDS_UNKNOWN_LABEL = '<1%';

/**
 * Optional slot odds from Storage `pick-recommendations.json` (`playProb`).
 * Same artifact as Lab / `usePickRecommendations`. Never computes live crowd %.
 *
 * Prefers `playProbBySong` (full history map, v1.68.0+). Falls back to per-slot
 * top-K rows on older artifacts. Returns null when the artifact is missing or
 * for another night — callers omit the odds row.
 *
 * @param {object | null | undefined} artifact
 * @param {string | null | undefined} selectedDate
 * @param {Record<string, unknown> | null | undefined} selfPayload
 * @returns {{ fieldId: string, label: string, song: string, playProb: number | null, unknown: boolean }[] | null}
 */
export function selectScorecardOdds(artifact, selectedDate, selfPayload) {
  if (!artifact || typeof artifact !== 'object') return null;
  const targetDate =
    typeof artifact.targetShow?.date === 'string' ? artifact.targetShow.date : '';
  if (!selectedDate || !targetDate || selectedDate !== targetDate) return null;

  const playProbBySong =
    artifact.playProbBySong && typeof artifact.playProbBySong === 'object'
      ? artifact.playProbBySong
      : null;
  const hasSlotLists = artifact.slots && typeof artifact.slots === 'object';
  if (!playProbBySong && !hasSlotLists) return null;

  /** @type {{ fieldId: string, label: string, song: string, playProb: number | null, unknown: boolean }[]} */
  const matched = [];

  for (const field of FORM_FIELDS) {
    const song = String(selfPayload?.[field.id] ?? '').trim();
    const key = normalizePickTitle(song);
    if (!key) continue;

    if (playProbBySong) {
      const fromMap = playProbBySong[key];
      if (typeof fromMap === 'number' && Number.isFinite(fromMap)) {
        matched.push({
          fieldId: field.id,
          label: field.label,
          song,
          playProb: fromMap,
          unknown: false,
        });
      } else {
        matched.push({
          fieldId: field.id,
          label: field.label,
          song,
          playProb: null,
          unknown: true,
        });
      }
      continue;
    }

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
        unknown: false,
      });
    }
  }

  return matched.length > 0 ? matched : null;
}

/**
 * @param {number | null | undefined} playProb
 * @param {{ unknown?: boolean }} [options]
 * @returns {string | null}
 */
export function formatOddsPercent(playProb, options = {}) {
  if (options.unknown) return SCORECARD_ODDS_UNKNOWN_LABEL;
  if (typeof playProb !== 'number' || !Number.isFinite(playProb)) return null;
  const pct = Math.round(Math.max(0, Math.min(1, playProb)) * 100);
  return `${pct}%`;
}
