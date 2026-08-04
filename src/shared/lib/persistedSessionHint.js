/**
 * Synchronous "this browser probably has a signed-in session" hint (#804).
 *
 * Firebase persists auth in IndexedDB, which cannot be read before the first
 * paint, so a cold open on `/` has no way to know a returning user is about to
 * be redirected to the dashboard. Auth writes this localStorage flag whenever a
 * session resolves and clears it on sign-out, giving boot code a same-tick
 * signal for chunk prefetch. It is a hint only — never an authorization check.
 */

import {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from './local-storage';

export const PERSISTED_SESSION_HINT_STORAGE_KEY = 'setpicks_session_hint_v1';

export function markPersistedSession() {
  setLocalStorageItem(PERSISTED_SESSION_HINT_STORAGE_KEY, '1');
}

export function clearPersistedSessionHint() {
  removeLocalStorageItem(PERSISTED_SESSION_HINT_STORAGE_KEY);
}

/** @returns {boolean} */
export function hasPersistedSessionHint() {
  return getLocalStorageItem(PERSISTED_SESSION_HINT_STORAGE_KEY) === '1';
}
