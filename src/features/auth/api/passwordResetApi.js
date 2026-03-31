import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

import { auth } from '../../../shared/lib/firebase';

export async function verifyPasswordResetCodeForEmail(oobCode) {
  return verifyPasswordResetCode(auth, oobCode);
}

// Prefetch the user's email for browser password manager heuristics.
export async function verifyResetCodeAndGetEmail(oobCode) {
  return verifyPasswordResetCode(auth, oobCode);
}

export async function confirmPasswordResetWithCode(oobCode, newPassword) {
  return confirmPasswordReset(auth, oobCode, newPassword);
}

