/**
 * Profile averages derived from existing season / career stats (#554).
 * Avg points needs no extra Firestore reads — only totalPoints / shows.
 * Avg correct uses `careerCorrectSlots` when materialised at finalize.
 * Avg vintage joins pick titles to catalog `debut` in memory (0 extra reads
 * once titles + catalog are already loaded).
 */

import { FORM_FIELDS } from '../../../shared/data/gameConfig';

export const PROFILE_SLOTS_PER_SHOW = FORM_FIELDS.length;

/**
 * @param {{ totalPoints?: unknown, shows?: unknown } | null | undefined} stats
 * @returns {number | null} Mean points per graded show, or null when undefined
 */
export function computeAvgPointsPerShow(stats) {
  const totalPoints =
    typeof stats?.totalPoints === 'number' && Number.isFinite(stats.totalPoints)
      ? stats.totalPoints
      : null;
  const shows =
    typeof stats?.shows === 'number' && Number.isFinite(stats.shows)
      ? stats.shows
      : null;
  if (totalPoints == null || shows == null || shows <= 0) return null;
  return totalPoints / shows;
}

/**
 * Display helper — one decimal when needed, otherwise integer string.
 *
 * @param {number | null | undefined} avg
 * @returns {string}
 */
export function formatAvgPointsPerShow(avg) {
  if (typeof avg !== 'number' || !Number.isFinite(avg)) return '—';
  const rounded = Math.round(avg * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * Mean correct slots per graded show.
 * `careerCorrectSlots / (shows * PROFILE_SLOTS_PER_SHOW)` when both are known.
 * Missing `careerCorrectSlots` → null (forward-only until rollup/backfill).
 *
 * @param {{
 *   careerCorrectSlots?: unknown,
 *   shows?: unknown,
 * } | null | undefined} stats
 * @returns {number | null}
 */
export function computeAvgCorrectPicksPerShow(stats) {
  const correct =
    typeof stats?.careerCorrectSlots === 'number' &&
    Number.isFinite(stats.careerCorrectSlots)
      ? stats.careerCorrectSlots
      : null;
  const shows =
    typeof stats?.shows === 'number' && Number.isFinite(stats.shows)
      ? stats.shows
      : null;
  if (correct == null || shows == null || shows <= 0) return null;
  return correct / (shows * PROFILE_SLOTS_PER_SHOW);
}

/**
 * Displayed batting-average style (".167", "1.000") — the bare ratio
 * ("0.17") read like a count of correct picks (#554 follow-up).
 *
 * @param {number | null | undefined} avg — slot-hit ratio in [0, 1]
 * @returns {string}
 */
export function formatAvgCorrectPicksPerShow(avg) {
  if (typeof avg !== 'number' || !Number.isFinite(avg)) return '—';
  const fixed = avg.toFixed(3);
  // Batting-average convention: drop the leading zero (.167), keep 1.000.
  return fixed.startsWith('0.') ? fixed.slice(1) : fixed;
}

/**
 * Parse catalog / Phish.net debut into a calendar year.
 * Accepts `YYYY-MM-DD`, bare `YYYY`, or leading-year strings.
 *
 * @param {unknown} debut
 * @returns {number | null}
 */
export function debutYearFromCatalogDebut(debut) {
  if (typeof debut === 'number' && Number.isFinite(debut)) {
    const y = Math.trunc(debut);
    return y >= 1900 && y <= 2100 ? y : null;
  }
  if (typeof debut !== 'string' || !debut.trim()) return null;
  const m = debut.trim().match(/^(\d{4})/);
  if (!m) return null;
  const y = Number(m[1]);
  if (!Number.isFinite(y) || y < 1900 || y > 2100) return null;
  return y;
}

/**
 * @param {{ name?: unknown, debut?: unknown }[] | null | undefined} songs
 * @returns {Map<string, number>} lowercased name → debut year
 */
export function buildDebutYearBySongName(songs) {
  const map = new Map();
  if (!Array.isArray(songs)) return map;
  for (const song of songs) {
    const name =
      typeof song?.name === 'string' ? song.name.trim().toLowerCase() : '';
    if (!name || map.has(name)) continue;
    const year = debutYearFromCatalogDebut(song?.debut);
    if (year != null) map.set(name, year);
  }
  return map;
}

/**
 * Mean debut year across **unique** song titles (case-insensitive).
 * Titles with unknown/missing debut are excluded from the mean.
 *
 * @param {Iterable<string> | null | undefined} songTitles
 * @param {Map<string, number> | Record<string, number> | null | undefined} debutYearByName
 * @returns {{ avgYear: number | null, datedCount: number, uniqueCount: number }}
 */
export function computeAvgSongVintage(songTitles, debutYearByName) {
  const unique = new Set();
  if (songTitles) {
    for (const title of songTitles) {
      if (typeof title !== 'string') continue;
      const key = title.trim().toLowerCase();
      if (key) unique.add(key);
    }
  }

  const lookup =
    debutYearByName instanceof Map
      ? (k) => debutYearByName.get(k)
      : debutYearByName && typeof debutYearByName === 'object'
        ? (k) => debutYearByName[k]
        : () => undefined;

  let sum = 0;
  let datedCount = 0;
  for (const key of unique) {
    const year = lookup(key);
    if (typeof year === 'number' && Number.isFinite(year)) {
      sum += year;
      datedCount += 1;
    }
  }

  return {
    avgYear: datedCount > 0 ? sum / datedCount : null,
    datedCount,
    uniqueCount: unique.size,
  };
}

/**
 * @param {number | null | undefined} avgYear
 * @returns {string}
 */
export function formatAvgSongVintage(avgYear) {
  if (typeof avgYear !== 'number' || !Number.isFinite(avgYear)) return '—';
  return String(Math.round(avgYear));
}
