import { useCallback } from 'react';

import { signOutUser } from '../api/authApi';

export function useSignOut() {
  return useCallback(async () => {
    await signOutUser();
  }, []);
}
