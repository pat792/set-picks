import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../../../shared/lib/firebase';

export function subscribeToAuthState(onChange) {
  return onAuthStateChanged(auth, onChange);
}

export async function fetchUserProfile(uid) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
}

export async function signOutUser() {
  await signOut(auth);
}
