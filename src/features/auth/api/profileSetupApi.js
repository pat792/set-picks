import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';

/**
 * First-time onboarding write to `users/{uid}`.
 * `createdAt` is a server timestamp so public profiles and date formatting stay consistent.
 */
export async function createInitialUserProfile(uid, { handle, favoriteSong, email }) {
  await setDoc(doc(db, 'users', uid), {
    handle: handle.trim(),
    email: email ?? null,
    favoriteSong: (favoriteSong || '').trim() || 'Unknown',
    createdAt: serverTimestamp(),
    totalPoints: 0,
  });
}
