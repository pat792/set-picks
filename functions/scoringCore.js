/**
 * Server-side scoring helpers extracted from `functions/index.js` so they can
 * be shared with ops tooling (e.g. `scripts/backfillBustouts.js`) without
 * pulling in the full Cloud Functions module graph.
 *
 * Mirrors `src/shared/utils/scoring.js` — keep the two in sync. The `bustouts`
 * snapshot on `actualSetlist` is the only source of truth for bustout boosts
 * (#214); absence/empty → no boost, no catalog fallback.
 */

const SCORING_RULES = {
  EXACT_SLOT: 10,
  ENCORE_EXACT: 15,
  IN_SETLIST: 5,
  WILDCARD_HIT: 10,
  BUSTOUT_BOOST: 20,
  BUSTOUT_MIN_GAP: 30,
};

const SCORE_FIELDS = ["s1o", "s1c", "s2o", "s2c", "enc", "wild"];

const NON_SONG_SETLIST_KEYS = new Set([
  "officialSetlist",
  "encoreSongs",
  "id",
  "bustouts",
]);

function normalizeSong(value) {
  return String(value ?? "").trim().toLowerCase();
}

function guessMatchesEncoreExact(actualSetlist, guessNorm) {
  if (!guessNorm) return false;
  const primary = normalizeSong(actualSetlist.enc);
  if (primary === guessNorm) return true;
  const list = actualSetlist.encoreSongs;
  if (!Array.isArray(list)) return false;
  return list.some((t) => normalizeSong(t) === guessNorm);
}

function buildAllPlayedNormalized(actualSetlist) {
  const fromSlots = [];
  for (const [key, val] of Object.entries(actualSetlist || {})) {
    if (NON_SONG_SETLIST_KEYS.has(key)) continue;
    if (typeof val !== "string") continue;
    const t = val.trim();
    if (!t) continue;
    fromSlots.push(normalizeSong(t));
  }

  const rawOfficial = actualSetlist.officialSetlist;
  const fromOfficial = Array.isArray(rawOfficial)
    ? rawOfficial
        .map((s) =>
          typeof s === "string" ? s.trim() : String(s ?? "").trim()
        )
        .filter(Boolean)
        .map((s) => normalizeSong(s))
    : [];

  const combined = [...fromSlots, ...fromOfficial];
  return [...new Set(combined)];
}

/** True if the persisted official payload contains at least one played song (slots + ordered list). */
function setlistHasAnyPlayedSong(actualSetlist) {
  return buildAllPlayedNormalized(actualSetlist).length > 0;
}

function calculateSlotScore(fieldId, guessedSong, actualSetlist) {
  if (!actualSetlist || !guessedSong) return 0;

  const guess = normalizeSong(guessedSong);
  if (!guess) return 0;

  const allPlayed = buildAllPlayedNormalized(actualSetlist);

  let base = 0;
  if (fieldId === "wild") {
    if (allPlayed.includes(guess)) {
      base = SCORING_RULES.WILDCARD_HIT;
    } else {
      return 0;
    }
  } else {
    const exactNonEnc =
      fieldId !== "enc" && normalizeSong(actualSetlist[fieldId]) === guess;
    const exactEnc =
      fieldId === "enc" && guessMatchesEncoreExact(actualSetlist, guess);
    if (exactNonEnc || exactEnc) {
      base =
        fieldId === "enc"
          ? SCORING_RULES.ENCORE_EXACT
          : SCORING_RULES.EXACT_SLOT;
    } else if (allPlayed.includes(guess)) {
      base = SCORING_RULES.IN_SETLIST;
    } else {
      return 0;
    }
  }

  const bustoutList = Array.isArray(actualSetlist.bustouts)
    ? actualSetlist.bustouts
    : [];
  let bustoutBoost = false;
  for (const raw of bustoutList) {
    if (typeof raw !== "string") continue;
    if (normalizeSong(raw) === guess) {
      bustoutBoost = true;
      break;
    }
  }

  return base + (bustoutBoost ? SCORING_RULES.BUSTOUT_BOOST : 0);
}

function calculateTotalScore(userPicks, actualSetlist) {
  if (!actualSetlist || !userPicks) return 0;
  return SCORE_FIELDS.reduce((total, fieldId) => {
    return (
      total + calculateSlotScore(fieldId, userPicks[fieldId], actualSetlist)
    );
  }, 0);
}

/** Mirrors `src/shared/utils/officialSetlistSanitize.js` (trim / drop empties). */
function sanitizeOfficialSongList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((s) => (typeof s === "string" ? s.trim() : String(s ?? "").trim()))
    .filter(Boolean);
}

function sanitizeBustouts(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of input) {
    const title = typeof raw === "string" ? raw.trim() : "";
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(title);
  }
  return out;
}

/**
 * Raw Firestore `official_setlists` doc → scoring shape **after** the same
 * trimming / list hygiene as `saveOfficialSetlistByDate` (#320 server parity).
 */
function persistableActualSetlistFromOfficialDoc(setlistDoc) {
  const rawSetlist =
    setlistDoc && typeof setlistDoc === "object" ? setlistDoc.setlist || {} : {};
  const out = {};
  for (const fieldId of SCORE_FIELDS) {
    const v = rawSetlist[fieldId];
    out[fieldId] = typeof v === "string" ? v.trim() : String(v ?? "").trim();
  }
  out.officialSetlist = sanitizeOfficialSongList(setlistDoc?.officialSetlist);

  let encoreSongs = [];
  const rawEnc = setlistDoc?.encoreSongs;
  if (Array.isArray(rawEnc) && rawEnc.length > 0) {
    encoreSongs = sanitizeOfficialSongList(rawEnc);
  } else if (out.enc) {
    encoreSongs = [out.enc];
  }
  if (encoreSongs.length > 0) {
    out.encoreSongs = encoreSongs;
  }
  if (Array.isArray(setlistDoc?.bustouts)) {
    out.bustouts = sanitizeBustouts(setlistDoc.bustouts);
  }
  return out;
}

function actualSetlistFromOfficialDoc(setlistDoc) {
  const setlistFlat = setlistDoc.setlist || {};
  const out = {
    ...setlistFlat,
    officialSetlist: Array.isArray(setlistDoc.officialSetlist)
      ? setlistDoc.officialSetlist
      : [],
  };
  if (Array.isArray(setlistDoc.encoreSongs) && setlistDoc.encoreSongs.length > 0) {
    out.encoreSongs = setlistDoc.encoreSongs;
  }
  // Per-show bustout snapshot for scoring (#214). Absence/empty → no boost.
  if (Array.isArray(setlistDoc.bustouts)) {
    out.bustouts = setlistDoc.bustouts;
  }
  return out;
}

module.exports = {
  SCORING_RULES,
  SCORE_FIELDS,
  NON_SONG_SETLIST_KEYS,
  normalizeSong,
  guessMatchesEncoreExact,
  buildAllPlayedNormalized,
  setlistHasAnyPlayedSong,
  calculateSlotScore,
  calculateTotalScore,
  actualSetlistFromOfficialDoc,
  persistableActualSetlistFromOfficialDoc,
};
