import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { getPasswordResetActionCodeSettings } from './passwordResetActionSettings';

/** Landing / Splash: Google popup sign-in. */
export function splashSignInWithGoogle(auth, googleProvider) {
  return signInWithPopup(auth, googleProvider);
}

/** Landing / Splash: email + password registration. */
export function splashRegisterWithEmail(auth, email, password) {
  return createUserWithEmailAndPassword(auth, email.trim(), password);
}

/** Landing / Splash: email + password sign-in. */
export function splashSignInWithEmail(auth, email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

/** Landing / Splash: send password reset email (continueUrl via passwordReset util). */
export function splashSendPasswordResetEmail(auth, email) {
  return sendPasswordResetEmail(auth, email.trim(), getPasswordResetActionCodeSettings());
}
