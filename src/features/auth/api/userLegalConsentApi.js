import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';
import {
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
} from '../../../shared/constants/legalDocVersions';

/**
 * @typedef {'email' | 'google'} LegalConsentMethod
 */

/**
 * Ensures `users/{uid}.legalConsent` reflects the app’s current Terms + Privacy
 * versions. Skips the write when the stored versions already match (preserves
 * the original `acceptedAt` and avoids a Firestore write on every sign-in).
 *
 * @param {string} uid
 * @param {{ method: LegalConsentMethod }} params
 * @returns {Promise<{ updated: boolean }>}
 */
export async function upsertUserLegalConsentIfOutdated(uid, { method }) {
  if (!uid) {
    throw new Error('upsertUserLegalConsentIfOutdated: uid is required');
  }
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const prev = snap.exists() ? snap.data()?.legalConsent : null;
  const unchanged =
    prev &&
    typeof prev === 'object' &&
    prev.termsVersion === LEGAL_TERMS_VERSION &&
    prev.privacyVersion === LEGAL_PRIVACY_VERSION;
  if (unchanged) {
    return { updated: false };
  }

  await setDoc(
    ref,
    {
      legalConsent: {
        termsVersion: LEGAL_TERMS_VERSION,
        privacyVersion: LEGAL_PRIVACY_VERSION,
        acceptedAt: serverTimestamp(),
        method,
      },
    },
    { merge: true }
  );
  return { updated: true };
}
