import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import {
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
} from '../../../shared/constants/legalDocVersions';
import { db } from '../../../shared/lib/firebase';

/**
 * @param {unknown} profile
 * @returns {boolean}
 */
export function needsLegalReconsent(profile) {
  if (!profile || typeof profile !== 'object') return false;
  // Only gate users who finished profile setup (dashboard-eligible).
  if (typeof profile.handle !== 'string' || !profile.handle.trim()) return false;

  const consent = profile.legalConsent;
  if (
    consent &&
    typeof consent === 'object' &&
    consent.termsVersion === LEGAL_TERMS_VERSION &&
    consent.privacyVersion === LEGAL_PRIVACY_VERSION
  ) {
    return false;
  }

  // Missing or outdated versioned consent (includes legacy timestamp-only docs).
  return true;
}

/**
 * Records affirmative Terms + Privacy consent (sign-up or re-consent gate).
 * Uses merge so a later `createInitialUserProfile` write does not overwrite this field.
 *
 * @param {string} uid
 */
export async function recordTermsPrivacyConsent(uid) {
  if (!uid?.trim()) {
    throw new Error('Missing uid.');
  }
  await setDoc(
    doc(db, 'users', uid.trim()),
    {
      termsPrivacyAcceptedAt: serverTimestamp(),
      legalConsent: {
        termsVersion: LEGAL_TERMS_VERSION,
        privacyVersion: LEGAL_PRIVACY_VERSION,
        acceptedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );
}
