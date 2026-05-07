import { collection, deleteDoc, getDocs } from 'firebase/firestore';

import { db } from './firebase';

/**
 * Deletes every `users/{uid}/private_fcmTokens/*` doc for the signed-in user.
 * Call while still authenticated, before `signOut`, so server-side sends stop
 * targeting stale device tokens (issue #274 / #277).
 *
 * @param {string | null | undefined} uid
 */
export async function clearWebPushTokenDocsForUser(uid) {
  if (!uid) return;
  const snap = await getDocs(collection(db, 'users', uid, 'private_fcmTokens'));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
