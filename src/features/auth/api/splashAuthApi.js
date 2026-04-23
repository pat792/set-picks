import {
  createUserWithEmailAndPassword,
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

export function signInWithGoogle(auth) {
  return signInWithPopup(auth, getGoogleProvider());
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
