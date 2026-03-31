import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';

import { getPasswordResetActionCodeSettings } from '../passwordResetActionSettings';

export function signInWithGoogle(auth, googleProvider) {
  return signInWithPopup(auth, googleProvider);
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
