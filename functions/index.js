const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const SCORE_FIELDS = ['s1o', 's1c', 's2o', 's2c', 'enc', 'wild'];

function normalizeSong(value) {
  return String(value || '').trim().toLowerCase();
}

function calculateSlotScore(fieldId, guessedSong, actualSetlist) {
  if (!actualSetlist || !guessedSong) return 0;
  const guess = normalizeSong(guessedSong);
  if (!guess) return 0;
  
  const actualExact = normalizeSong(actualSetlist[fieldId]);
  if (actualExact === guess) return 1;

  const allPlayed = Object.values(actualSetlist).map((song) => normalizeSong(song));
  if (allPlayed.includes(guess)) return 0.5;

  return 0;
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
    const actualSetlist = setlistDoc.setlist || {};

    const picksSnap = await db
      .collection('picks')
      .where('showDate', '==', showDate)
      .get();

    if (picksSnap.empty) {
      return null;
    }

    const batch = db.batch();

    picksSnap.forEach((pickDoc) => {
      const pickData = pickDoc.data() || {};
      const userPicks = pickData.picks || {};
      const score = calculateTotalScore(userPicks, actualSetlist);

      batch.update(pickDoc.ref, {
        score,
        gradedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    return null;
  }
);