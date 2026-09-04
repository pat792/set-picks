import { FORM_FIELDS } from '../../../shared/data/gameConfig';

import { normalizePickTitle } from './groupPickRecommendations';

/** Shown when the night’s map exists but the pick is not in history. */
export const SCORECARD_ODDS_UNKNOWN_LABEL = '<1%';

/** Narrow-viewport form of {@link SCORECARD_ODDS_UNKNOWN_LABEL} (#1013). */
export const SCORECARD_ODDS_UNKNOWN_LABEL_COMPACT = '<1';

/**
 * @param {object | null | undefined} artifact
 * @param {string | null | undefined} selectedDate
 * @returns {boolean}
 */
export function artifactTargetsDate(artifact, selectedDate) {
  if (!artifact || typeof artifact !== 'object') return false;
  const targetDate =
    typeof artifact.targetShow?.date === 'string' ? artifact.targetShow.date.trim() : '';
  const date = typeof selectedDate === 'string' ? selectedDate.trim() : '';
  return Boolean(date && targetDate && date === targetDate);
}

/**
 * Song-level playProb from the published artifact (#1013 Workstream C).
 * Returns null when the artifact is missing or for another night (omit odds UI).
 * When `playProbBySong` exists, map misses are `{ playProb: null, unknown: true }`.
 * Legacy top-K artifacts return a match or null (no unknown floor).
 *
 * @param {object | null | undefined} artifact
 * @param {string | null | undefined} selectedDate
 * @param {string | null | undefined} songName
 * @returns {{ playProb: number | null, unknown: boolean } | null}
 */
export function lookupPlayProbForSong(artifact, selectedDate, songName) {
  if (!artifactTargetsDate(artifact, selectedDate)) return null;
  const key = normalizePickTitle(songName);
  if (!key) return null;

  const playProbBySong =
    artifact.playProbBySong && typeof artifact.playProbBySong === 'object'
      ? artifact.playProbBySong
      : null;

  if (playProbBySong) {
    const fromMap = playProbBySong[key];
    if (typeof fromMap === 'number' && Number.isFinite(fromMap)) {
      return { playProb: fromMap, unknown: false };
    }
    return { playProb: null, unknown: true };
  }

  const slots = artifact.slots && typeof artifact.slots === 'object' ? artifact.slots : null;
  if (!slots) return null;

  for (const slotRows of Object.values(slots)) {
    if (!Array.isArray(slotRows)) continue;
    const row = slotRows.find((item) => {
      if (!item || typeof item !== 'object') return false;
      const itemKey =
        normalizePickTitle(item.normalizedName) || normalizePickTitle(item.name);
      return itemKey === key;
    });
    if (typeof row?.playProb === 'number' && Number.isFinite(row.playProb)) {
      return { playProb: row.playProb, unknown: false };
    }
  }

  return null;
}

/**
 * Dropdown label for Make Picks (#1013 C1). `compactLabel` is set only for
 * map misses so the picker can show `<1` on narrow viewports.
 *
 * @param {object | null | undefined} artifact
 * @param {string | null | undefined} selectedDate
 * @param {string | null | undefined} songName
 * @returns {{ label: string, compactLabel?: string } | null}
 */
export function resolvePickerOddsLabel(artifact, selectedDate, songName) {
  const lookup = lookupPlayProbForSong(artifact, selectedDate, songName);
  if (!lookup) return null;
  return {
    label: formatOddsPercent(lookup.playProb, { unknown: lookup.unknown }),
    compactLabel: lookup.unknown
      ? formatOddsPercent(lookup.playProb, { unknown: true, compact: true })
      : undefined,
  };
}

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
  if (!artifactTargetsDate(artifact, selectedDate)) return null;

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
      const lookup = lookupPlayProbForSong(artifact, selectedDate, song);
      if (!lookup) continue;
      matched.push({
        fieldId: field.id,
        label: field.label,
        song,
        playProb: lookup.playProb,
        unknown: lookup.unknown,
      });
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
 * @param {{ unknown?: boolean, compact?: boolean }} [options]
 * @returns {string | null}
 */
export function formatOddsPercent(playProb, options = {}) {
  if (options.unknown) {
    return options.compact
      ? SCORECARD_ODDS_UNKNOWN_LABEL_COMPACT
      : SCORECARD_ODDS_UNKNOWN_LABEL;
  }
  if (typeof playProb !== 'number' || !Number.isFinite(playProb)) return null;
  const pct = Math.round(Math.max(0, Math.min(1, playProb)) * 100);
  return `${pct}%`;
}
