import { useCallback } from 'react';

import { POOL_INVITE_STORAGE_KEY } from '../../../shared/config/poolInvite';
import { removeLocalStorageItem } from '../../../shared/lib/local-storage';
import { signOutUser } from '../api/authApi';

export function useSignOut() {
  return useCallback(async () => {
    await signOutUser();
    removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
  }, []);
}
