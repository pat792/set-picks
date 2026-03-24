import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { getPasswordResetActionCodeSettings } from './passwordResetActionSettings';

export async function sendAccountPasswordResetEmail(email) {
  return sendPasswordResetEmail(auth, email, getPasswordResetActionCodeSettings());
}

export async function updateAccountSecurity({ user, currentPassword, newEmail, newPassword }) {
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  if (newEmail) {
    await updateEmail(user, newEmail);
    await updateDoc(doc(db, 'users', user.uid), {
      email: newEmail,
      updatedAt: new Date().toISOString(),
    });
  }

  if (newPassword) {
    await updatePassword(user, newPassword);
  }
}
