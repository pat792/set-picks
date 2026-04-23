import { onAuthStateChanged, onIdTokenChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../../../shared/lib/firebase';
import { whenFirebaseReady } from '../../../shared/lib/firebaseAppCheck';

export function subscribeToAuthState(onChange) {
  return onAuthStateChanged(auth, onChange);
}

/**
 * Subscribe to ID token changes. Fires when the user signs in, signs out, or
 * their ID token is refreshed (which is how Firebase propagates custom claim
 * updates after `setAdminClaim`). Use alongside `subscribeToAuthState` when a
 * feature needs claim-level freshness (e.g. admin gating).
 */
export function subscribeToIdTokenChanges(onChange) {
  return onIdTokenChanged(auth, onChange);
}

/**
 * Resolve whether the given Firebase user is an admin. Claim-only as of
 * issue #139 PR B — the transitional hard-coded admin email fallback from
 * PR A was removed alongside the Firestore rules tightening.
 *
 * Pass `forceRefresh` when you need to pick up a freshly-granted claim without
 * waiting for the next automatic token refresh.
 *
 * @param {import('firebase/auth').User | null | undefined} user
 * @param {{ forceRefresh?: boolean }} [opts]
 * @returns {Promise<boolean>}
 */
export async function resolveIsAdmin(user, { forceRefresh = false } = {}) {
  if (!user) return false;
  try {
    const tokenResult = await user.getIdTokenResult(forceRefresh);
    return tokenResult?.claims?.admin === true;
  } catch {
    return false;
  }
}

export async function fetchUserProfile(uid) {
  await whenFirebaseReady();
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
}

export async function signOutUser() {
  await signOut(auth);
}
