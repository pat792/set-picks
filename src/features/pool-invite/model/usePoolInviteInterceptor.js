import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  removeLocalStorageItem,
  setLocalStorageItem,
} from '../../../shared/lib/local-storage';
import { isValidPoolInviteCodeFormat } from '../lib/inviteCodeFormat';
import { POOL_INVITE_STORAGE_KEY } from '../config';

function normalizeInviteCode(raw) {
  if (raw == null || typeof raw !== 'string') return '';
  return raw.trim().toUpperCase();
}

export function usePoolInviteInterceptor() {
  const { code: rawCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = normalizeInviteCode(rawCode);
    if (!code || !isValidPoolInviteCodeFormat(code)) {
      removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
    } else {
      setLocalStorageItem(POOL_INVITE_STORAGE_KEY, code);
    }
    navigate('/', { replace: true });
  }, [rawCode, navigate]);
}
