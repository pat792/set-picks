import { useParams } from 'react-router-dom';

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

/** Persists a valid pool invite code from the route param (sync during render). */
export function storePoolInviteCodeFromParam(rawCode) {
  const code = normalizeInviteCode(rawCode);
  if (!code || !isValidPoolInviteCodeFormat(code)) {
    removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
    return;
  }
  setLocalStorageItem(POOL_INVITE_STORAGE_KEY, code);
}

/**
 * Stores `phish_pool_pending_invite` from `/join/:code` without leaving the route.
 * Runs synchronously so signed-in redirects still capture the code.
 */
export function usePoolInviteCodeStorage() {
  const { code: rawCode } = useParams();
  storePoolInviteCodeFromParam(rawCode);
}
