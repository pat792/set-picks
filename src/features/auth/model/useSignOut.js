import { useCallback } from 'react';

import { POOL_INVITE_STORAGE_KEY } from '../../../shared/config/poolInvite';
import { clearWebPushTokenDocsForUser } from '../../../shared/lib/clearWebPushTokens';
import { revokeFcmDeviceToken } from '../../../shared/lib/firebaseMessaging';
import { removeLocalStorageItem } from '../../../shared/lib/local-storage';
import { auth } from '../../../shared/lib/firebase';
import { signOutUser } from '../api/authApi';
import { markPostSignOutHome } from './postSignOutHome';

const CLEANUP_MS = 2500;

/**
 * @param {Promise<unknown>} promise
 * @param {number} ms
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    }),
  ]);
}

export function useSignOut() {
  return useCallback(async () => {
    // Before auth clears: dashboard guard must not HardRedirect to /login (#899).
    markPostSignOutHome();

    const uid = auth.currentUser?.uid;
    try {
      await withTimeout(revokeFcmDeviceToken(), CLEANUP_MS);
    } catch {
      // Best-effort: SW / messaging may be unavailable after a prior error.
    }
    if (uid) {
      try {
        await withTimeout(clearWebPushTokenDocsForUser(uid), CLEANUP_MS);
      } catch {
        // Tokens may already be cleared; still proceed with sign-out.
      }
    }
    await signOutUser();
    removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);

    // Marketing document (not app soft-nav `/` splash). Wins over /login bounce.
    if (typeof window !== 'undefined') {
      window.location.assign('/');
    }
  }, []);
}
