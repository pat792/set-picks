import { onAuthStateChanged, onIdTokenChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

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

/**
 * Real-time subscription to `users/{uid}`. Use instead of `fetchUserProfile`
 * when the caller needs the profile to live-update — for example, the
 * splash → setup → dashboard flow, where the route guard needs to react
 * to the user completing setup without forcing a full page reload.
 *
 * Waits for App Check before attaching the listener so an unwarmed App
 * Check token can't cause a permission-denied snapshot error on first
 * render.
 *
 * @param {string} uid
 * @param {(profile: object | null) => void} onNext  Receives `data()` or null.
 * @param {(err: unknown) => void} [onError]
 * @returns {Promise<() => void>}  Resolves to an unsubscribe function once
 *   Firebase / App Check are ready. The caller MUST invoke the returned
 *   function when the subscription is no longer needed.
 */
export async function subscribeToUserProfile(uid, onNext, onError) {
  await whenFirebaseReady();
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snap) => onNext(snap.exists() ? snap.data() : null),
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function signOutUser() {
  await signOut(auth);
}
