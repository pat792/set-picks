import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { ensureFirebase } from '../../../shared/lib/ensureFirebase';
import { whenFirebaseReady } from '../../../shared/lib/firebaseAppCheck';

/**
 * Records affirmative Terms + Privacy consent at account creation (sign-up).
 * Uses merge so a later `createInitialUserProfile` write does not overwrite this field.
 *
 * @param {string} uid
 */
export async function recordTermsPrivacyConsent(uid) {
  if (!uid?.trim()) {
    throw new Error('Missing uid.');
  }
  await whenFirebaseReady();
  const { db } = await ensureFirebase();
  await setDoc(
    doc(db, 'users', uid.trim()),
    {
      termsPrivacyAcceptedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
