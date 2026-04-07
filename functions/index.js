const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { PHISH_SONGS: phishSongs } = require("./phishSongs");

admin.initializeApp();
const db = admin.firestore();

// Mirrors src/utils/scoring.js (keep in sync).
const SCORING_RULES = {
  EXACT_SLOT: 10,
  ENCORE_EXACT: 15,
  IN_SETLIST: 5,
  WILDCARD_HIT: 10,
  BUSTOUT_BOOST: 20,
  BUSTOUT_MIN_GAP: 30,
};

const SCORE_FIELDS = ["s1o", "s1c", "s2o", "s2c", "enc", "wild"];

/** Keys on the scoring payload that are not slot song strings. */
const NON_SONG_SETLIST_KEYS = new Set(["officialSetlist", "id", "bustouts"]);

function normalizeSong(value) {
  return String(value ?? "").trim().toLowerCase();
}

function parseGap(gap) {
  if (gap == null || gap === "" || gap === "—") return null;
  const n = Number.parseInt(String(gap), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Slot strings from the flat map plus ordered officialSetlist, normalized and deduped.
 * Same as buildAllPlayedNormalized in src/utils/scoring.js.
 * @param {Record<string, unknown>} actualSetlist
 * @returns {string[]}
 */
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

/** Matches computeSlotResult + bustout from getSlotScoreBreakdown in src/utils/scoring.js. */
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
    const actualExact = normalizeSong(actualSetlist[fieldId]);
    if (actualExact === guess) {
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

  const matched = phishSongs.find(
    (song) => normalizeSong(song.name) === guess
  );
  let bustoutBoost = false;
  if (matched) {
    const gapNum = parseGap(matched.gap);
    bustoutBoost =
      gapNum != null && gapNum >= SCORING_RULES.BUSTOUT_MIN_GAP;
  }

  return base + (bustoutBoost ? SCORING_RULES.BUSTOUT_BOOST : 0);
}

function calculateTotalScore(userPicks, actualSetlist) {
  if (!actualSetlist || !userPicks) return 0;
  return SCORE_FIELDS.reduce((total, fieldId) => {
    return total + calculateSlotScore(fieldId, userPicks[fieldId], actualSetlist);
  }, 0);
}

exports.gradePicksOnSetlistWrite = onDocumentWritten(
  "official_setlists/{showDate}",
  async (event) => {
    if (!event.data.after.exists) {
      return null;
    }

    const showDate = event.params.showDate;
    const setlistDoc = event.data.after.data() || {};
    const setlistFlat = setlistDoc.setlist || {};
    const actualSetlist = {
      ...setlistFlat,
      officialSetlist: Array.isArray(setlistDoc.officialSetlist)
        ? setlistDoc.officialSetlist
        : [],
    };

    const picksSnap = await db
      .collection("picks")
      .where("showDate", "==", showDate)
      .get();

    if (picksSnap.empty) {
      return null;
    }

    const batch = db.batch();

    picksSnap.forEach((pickDoc) => {
      const pickData = pickDoc.data() || {};
      const userPicks = pickData.picks || {};
      const score = calculateTotalScore(userPicks, actualSetlist);

      // Live scoring only: do not set gradedAt here (pool season uses isGraded from rollup).
      const update = { score };
      if (pickData.isGraded !== true) {
        update.gradedAt = admin.firestore.FieldValue.delete();
      }
      batch.update(pickDoc.ref, update);
    });

    await batch.commit();
    return null;
  }
);
