import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import { POOL_INVITE_STORAGE_KEY } from '../../shared/config/poolInvite';
import { removeLocalStorageItem } from '../../shared/lib/local-storage';

/**
 * `/join` with no code segment — clear stale breadcrumb and send user home.
 */
export default function PoolInviteMissingCodePage() {
  useEffect(() => {
    removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
  }, []);

  return <Navigate to="/" replace />;
}
