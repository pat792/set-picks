import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
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

/**
 * Best-effort rollback when post-sign-up Firestore writes fail (e.g. legal consent).
 * @param {import('firebase/auth').User | null} user
 */
export async function deleteAuthUserIfPresent(user) {
  if (!user) return;
  try {
    await deleteUser(user);
  } catch {
    // Caller logs; deletion may fail if session already invalidated.
  }
}

export function signInWithEmail(auth, email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function sendResetEmail(auth, email) {
  return sendPasswordResetEmail(auth, email.trim(), getPasswordResetActionCodeSettings());
}

/** @param {import('firebase/auth').Auth} auth */
export function signOutUser(auth) {
  return signOut(auth);
}
