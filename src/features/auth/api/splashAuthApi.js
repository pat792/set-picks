import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';

import { getPasswordResetActionCodeSettings } from '../utils/passwordResetActionSettings';

// Construct lazily on first Google sign-in attempt so the shared Firebase
// boot module doesn't allocate it on splash load (issue #242).
let googleProvider = null;

function getGoogleProvider() {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
  }
  return googleProvider;
}

/**
 * Sign in with Google via popup and report whether this is a brand-new
 * Firebase user. Returning the boolean here (rather than the raw
 * `UserCredential`) keeps `firebase/auth` out of the model layer — the
 * `getAdditionalUserInfo` helper is the only reason callers need to
 * touch the credential, and analytics is the only consumer.
 *
 * @param {import('firebase/auth').Auth} auth
 * @returns {Promise<{ isNewUser: boolean }>}
 */
export async function signInWithGoogle(auth) {
  const cred = await signInWithPopup(auth, getGoogleProvider());
  const extra = getAdditionalUserInfo(cred);
  return { isNewUser: Boolean(extra?.isNewUser) };
}

export function registerWithEmail(auth, email, password) {
  return createUserWithEmailAndPassword(auth, email.trim(), password);
}

export function signInWithEmail(auth, email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function sendResetEmail(auth, email) {
  return sendPasswordResetEmail(auth, email.trim(), getPasswordResetActionCodeSettings());
}
