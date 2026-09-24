import { doc, getDoc } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';
import { whenFirebaseReady } from '../../../shared/lib/firebaseAppCheck';
import {
  ALL_TIME_LEADERBOARD_DOC_ID,
  tourLeaderboardDocId,
} from '../model/globalLeaderboardRanking';

export const GLOBAL_STATS_LEADERBOARDS_COLLECTION = 'global_stats_leaderboards';

/**
 * Point-read a Functions-owned leaderboard aggregate.
 * Callers must not query or scan `users`.
 *
 * @param {'allTime' | { tourKey: string }} scope
 * @returns {Promise<object | null>}
 */
export async function fetchGlobalLeaderboardDoc(scope) {
  const docId =
    scope === 'allTime'
      ? ALL_TIME_LEADERBOARD_DOC_ID
      : tourLeaderboardDocId(scope?.tourKey || '');
  if (!docId || docId === 'tour:') return null;
  await whenFirebaseReady();
  const snap = await getDoc(doc(db, GLOBAL_STATS_LEADERBOARDS_COLLECTION, docId));
  if (!snap.exists()) return null;
  return snap.data();
}

/**
 * Signed-in viewer only — used for the you-row when Auth profile is missing.
 *
 * @param {string} uid
 * @returns {Promise<object | null>}
 */
export async function fetchViewerUserDoc(uid) {
  const id = uid?.trim();
  if (!id) return null;
  await whenFirebaseReady();
  const snap = await getDoc(doc(db, 'users', id));
  if (!snap.exists()) return null;
  return snap.data();
}
