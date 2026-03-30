import { FORM_FIELDS } from '../data/gameConfig';
import { PHISH_SONGS } from '../data/phishSongs.js';

export const SCORING_RULES = {
  EXACT_SLOT: 10,
  /** Encore slot only: exact match with official encore pick. */
  ENCORE_EXACT: 15,
  IN_SETLIST: 5,
  /** Wildcard: song appeared anywhere in the show (slots + officialSetlist). */
  WILDCARD_HIT: 10,
  BUSTOUT_BOOST: 20,
  /** Minimum catalog gap (shows since last play) to earn the bustout boost. */
  BUSTOUT_MIN_GAP: 30,
};

const normalize = (s) => String(s ?? '').trim().toLowerCase();

/** Keys on the scoring payload that are not slot song strings. */
const NON_SONG_SETLIST_KEYS = new Set(['officialSetlist', 'id', 'bustouts']);

function parseGap(gap) {
  if (gap == null || gap === '' || gap === '—') return null;
  const n = Number.parseInt(String(gap), 10);
  return Number.isFinite(n) ? n : null;
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
 * @returns {{ base: number, bustoutBoost: boolean }}
 */
function computeSlotResult(fieldId, guessedSong, actualSetlist) {
  if (!actualSetlist || !guessedSong) {
    return { base: 0, bustoutBoost: false };
  }

  const guess = normalize(guessedSong);
  if (!guess) return { base: 0, bustoutBoost: false };

  const allPlayed = buildAllPlayedNormalized(actualSetlist);

  let base = 0;
  if (fieldId === 'wild') {
    if (allPlayed.includes(guess)) {
      base = SCORING_RULES.WILDCARD_HIT;
    } else {
      return { base: 0, bustoutBoost: false };
    }
  } else {
    const actualExact = normalize(actualSetlist[fieldId]);
    if (actualExact === guess) {
      base =
        fieldId === 'enc'
          ? SCORING_RULES.ENCORE_EXACT
          : SCORING_RULES.EXACT_SLOT;
    } else if (allPlayed.includes(guess)) {
      base = SCORING_RULES.IN_SETLIST;
    } else {
      return { base: 0, bustoutBoost: false };
    }
  }

  const matched = PHISH_SONGS.find((song) => normalize(song.name) === guess);
  let bustoutBoost = false;
  if (matched) {
    const gapNum = parseGap(matched.gap);
    bustoutBoost = gapNum != null && gapNum >= SCORING_RULES.BUSTOUT_MIN_GAP;
  }

  return { base, bustoutBoost };
}

/** Points for one slot + whether the bustout boost applied (correct pick + gap ≥ BUSTOUT_MIN_GAP in song catalog). */
export const getSlotScoreBreakdown = (fieldId, guessedSong, actualSetlist) => {
  const { base, bustoutBoost } = computeSlotResult(fieldId, guessedSong, actualSetlist);
  const boostPts = bustoutBoost ? SCORING_RULES.BUSTOUT_BOOST : 0;
  return {
    points: base + boostPts,
    bustoutBoost,
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
