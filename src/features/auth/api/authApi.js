import { onAuthStateChanged, onIdTokenChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../../../shared/lib/firebase';

/** Transition-only fallback while rolling out admin custom claims (issue #139). */
const LEGACY_ADMIN_EMAIL = 'pat@road2media.com';

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
 * Resolve whether the given Firebase user is an admin. Prefers the
 * `admin: true` custom claim (#139 target state); falls back to the legacy
 * hard-coded admin email during PR A so existing flows keep working until the
 * claim is granted to every real admin.
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
    if (tokenResult?.claims?.admin === true) return true;
  } catch {
    // fall through to email fallback
  }
  return user.email === LEGACY_ADMIN_EMAIL;
}

export async function fetchUserProfile(uid) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
}

export async function signOutUser() {
  await signOut(auth);
}
