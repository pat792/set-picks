import { useCallback } from 'react';

import { POOL_INVITE_STORAGE_KEY } from '../../../shared/config/poolInvite';
import { clearWebPushTokenDocsForUser } from '../../../shared/lib/clearWebPushTokens';
import { revokeFcmDeviceToken } from '../../../shared/lib/firebaseMessaging';
import { removeLocalStorageItem } from '../../../shared/lib/local-storage';
import { auth } from '../../../shared/lib/firebase';
import { signOutUser } from '../api/authApi';

export function useSignOut() {
  return useCallback(async () => {
    const uid = auth.currentUser?.uid;
    try {
      await revokeFcmDeviceToken();
    } catch {
      // Best-effort: SW / messaging may be unavailable after a prior error.
    }
    if (uid) {
      try {
        await clearWebPushTokenDocsForUser(uid);
      } catch {
        // Tokens may already be cleared; still proceed with sign-out.
      }
    }
    await signOutUser();
    removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
  }, []);
}
