import {
  collection,
  doc,
  getDocs,
  increment,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../shared/lib/firebase';
import { calculateTotalScore } from '../../../shared/utils/scoring';

const MAX_BATCH_OPS = 500;
const OPS_PER_PICK = 2;

export async function rollupScoresForShow({ showDate, actualSetlistPayload }) {
  const picksQuery = query(collection(db, 'picks'), where('showDate', '==', showDate));
  const picksSnap = await getDocs(picksQuery);

  let batch = writeBatch(db);
  let opCount = 0;
  let processedPicks = 0;
  let skippedPicks = 0;

  for (const pickDoc of picksSnap.docs) {
    const pickData = pickDoc.data();
    if (!pickData.userId) {
      skippedPicks += 1;
      continue;
    }

    if (opCount + OPS_PER_PICK > MAX_BATCH_OPS) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }

    const userPicks = pickData.picks || pickData;
    const newScore = calculateTotalScore(userPicks, actualSetlistPayload);
    const oldScore = pickData.score || 0;
    const scoreDiff = newScore - oldScore;
    const isFirstGrade = !pickData.isGraded;

    batch.update(pickDoc.ref, { score: newScore, isGraded: true });
    batch.set(
      doc(db, 'users', pickData.userId),
      {
        totalPoints: increment(scoreDiff),
        showsPlayed: increment(isFirstGrade ? 1 : 0),
      },
      { merge: true }
    );

    opCount += OPS_PER_PICK;
    processedPicks += 1;
  }

  if (opCount > 0) {
    await batch.commit();
  }

  return {
    processedPicks,
    skippedPicks,
    totalPicks: picksSnap.size,
  };
}
