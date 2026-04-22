import { FORM_FIELDS } from '../data/gameConfig';

export const SCORING_RULES = {
  EXACT_SLOT: 10,
  /** Encore slot only: exact match with official encore pick. */
  ENCORE_EXACT: 15,
  IN_SETLIST: 5,
  /** Wildcard: song appeared anywhere in the show (slots + officialSetlist). */
  WILDCARD_HIT: 10,
  BUSTOUT_BOOST: 20,
  /**
   * Minimum pre-show gap to count as a bustout. Kept as a named constant for
   * the write paths (`setlistParser`, live automation) that derive
   * `official_setlists.bustouts` from Phish.net row `gap`. Scoring itself no
   * longer evaluates this at read time — it consumes the frozen `bustouts`
   * snapshot instead (#214).
   */
  BUSTOUT_MIN_GAP: 30,
};

const normalize = (s) => String(s ?? '').trim().toLowerCase();

/** Keys on the scoring payload that are not slot song strings. */
const NON_SONG_SETLIST_KEYS = new Set(['officialSetlist', 'encoreSongs', 'id', 'bustouts']);

/**
 * Encore exact: primary `enc` slot plus optional `encoreSongs` (multi-encore shows).
 * @param {Record<string, unknown>} actualSetlist
 * @param {string} guessNorm
 */
function guessMatchesEncoreExact(actualSetlist, guessNorm) {
  if (!guessNorm) return false;
  const primary = normalize(actualSetlist.enc);
  if (primary === guessNorm) return true;
  const list = actualSetlist.encoreSongs;
  if (!Array.isArray(list)) return false;
  return list.some((t) => normalize(t) === guessNorm);
}

/**
 * Slot strings from the flat map plus ordered `officialSetlist`, normalized and deduped.
 * @param {Record<string, unknown>} actualSetlist
 * @returns {string[]}
 */
function buildAllPlayedNormalized(actualSetlist) {
  const fromSlots = [];
  for (const [key, val] of Object.entries(actualSetlist)) {
    if (NON_SONG_SETLIST_KEYS.has(key)) continue;
    if (typeof val !== 'string') continue;
    const t = val.trim();
    if (!t) continue;
    fromSlots.push(normalize(t));
  }

  const rawOfficial = actualSetlist.officialSetlist;
  const fromOfficial = Array.isArray(rawOfficial)
    ? rawOfficial
        .map((s) => (typeof s === 'string' ? s.trim() : String(s ?? '').trim()))
        .filter(Boolean)
        .map((s) => normalize(s))
    : [];

  const combined = [...fromSlots, ...fromOfficial];
  return [...new Set(combined)];
}

/**
 * Why this slot scored (or did not). Used in standings pick breakdown UI.
 * @typedef {'none' | 'miss' | 'in_setlist' | 'exact_slot' | 'encore_exact' | 'wildcard_hit'} ScoreBreakdownKind
 */

/** Short labels aligned with scoring rules copy (standings detail / tooltips). */
export const SCORE_BREAKDOWN_KIND_LABEL = {
  none: '',
  miss: 'Not in show',
  in_setlist: 'In setlist',
  exact_slot: 'Exact slot',
  encore_exact: 'Exact encore',
  wildcard_hit: 'Wildcard hit',
};

/**
 * @returns {{ base: number, bustoutBoost: boolean, kind: ScoreBreakdownKind }}
 */
function computeSlotResult(fieldId, guessedSong, actualSetlist) {
  if (!actualSetlist || !guessedSong) {
    return { base: 0, bustoutBoost: false, kind: 'none' };
  }

  const guess = normalize(guessedSong);
  if (!guess) return { base: 0, bustoutBoost: false, kind: 'none' };

  const allPlayed = buildAllPlayedNormalized(actualSetlist);

  let base = 0;
  if (fieldId === 'wild') {
    if (allPlayed.includes(guess)) {
      base = SCORING_RULES.WILDCARD_HIT;
    } else {
      return { base: 0, bustoutBoost: false, kind: 'miss' };
    }
  } else {
    const exactNonEnc =
      fieldId !== 'enc' && normalize(actualSetlist[fieldId]) === guess;
    const exactEnc = fieldId === 'enc' && guessMatchesEncoreExact(actualSetlist, guess);
    if (exactNonEnc || exactEnc) {
      base =
        fieldId === 'enc'
          ? SCORING_RULES.ENCORE_EXACT
          : SCORING_RULES.EXACT_SLOT;
    } else if (allPlayed.includes(guess)) {
      base = SCORING_RULES.IN_SETLIST;
    } else {
      return { base: 0, bustoutBoost: false, kind: 'miss' };
    }
  }

  // Bustout boost reads the per-show snapshot on the official setlist doc
  // (#214). Absence or empty array → no bustout boost; no catalog fallback.
  // The snapshot is written at save time from Phish.net row `gap` (pre-show
  // by construction), which decouples scoring from the weekly
  // `song-catalog.json` refresh cadence.
  const bustoutList = Array.isArray(actualSetlist.bustouts) ? actualSetlist.bustouts : [];
  let bustoutBoost = false;
  for (const raw of bustoutList) {
    if (typeof raw !== 'string') continue;
    if (normalize(raw) === guess) {
      bustoutBoost = true;
      break;
    }
  }

  /** @type {ScoreBreakdownKind} */
  let kind = 'exact_slot';
  if (fieldId === 'wild') {
    kind = 'wildcard_hit';
  } else if (fieldId === 'enc' && base === SCORING_RULES.ENCORE_EXACT) {
    kind = 'encore_exact';
  } else if (base === SCORING_RULES.IN_SETLIST) {
    kind = 'in_setlist';
  }

  return { base, bustoutBoost, kind };
}

/**
 * Points for one slot + whether the bustout boost applied + kind for UI labels.
 * Bustout does not change `kind` (still the base rule that earned points).
 */
export const getSlotScoreBreakdown = (fieldId, guessedSong, actualSetlist) => {
  const { base, bustoutBoost, kind } = computeSlotResult(fieldId, guessedSong, actualSetlist);
  const boostPts = bustoutBoost ? SCORING_RULES.BUSTOUT_BOOST : 0;
  return {
    points: base + boostPts,
    bustoutBoost,
    kind,
  };
};

export const calculateSlotScore = (fieldId, guessedSong, actualSetlist) => {
  return getSlotScoreBreakdown(fieldId, guessedSong, actualSetlist).points;
};

export const calculateTotalScore = (userPicks, actualSetlist) => {
  if (!actualSetlist || !userPicks) return 0;

  let total = 0;
  FORM_FIELDS.forEach((field) => {
    total += calculateSlotScore(field.id, userPicks[field.id], actualSetlist);
  });

  return total;
};
