import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { setLocalStorageItem } from '../../../shared/lib/local-storage';
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
    if (code) {
      setLocalStorageItem(POOL_INVITE_STORAGE_KEY, code);
    }
    navigate('/', { replace: true });
  }, [rawCode, navigate]);
}
