const STORAGE_KEY = 'setpicks_google_redirect_intent_v1';

/**
 * @param {Storage | undefined} store
 * @param {string} key
 * @param {string} value
 */
function safeSet(store, key, value) {
  try {
    store?.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

/**
 * @param {Storage | undefined} store
 * @param {string} key
 * @returns {string | null}
 */
function safeGet(store, key) {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {Storage | undefined} store
 * @param {string} key
 */
function safeRemove(store, key) {
  try {
    store?.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Stash which splash modal started a Google redirect (#773 Phase 2b).
 * Dual-write session + local so Safari private / ITP drops of sessionStorage
 * still leave a return hint for overlay / error copy (#893). Credential
 * completion must not depend on this stash — see useGoogleRedirectCompletion.
 * @param {'signin' | 'signup'} intent
 */
export function stashGoogleRedirectIntent(intent) {
  if (intent !== 'signin' && intent !== 'signup') return;
  // Prefer globals (vitest stubs) — `window` may be absent in node tests.
  safeSet(globalThis.sessionStorage, STORAGE_KEY, intent);
  safeSet(globalThis.localStorage, STORAGE_KEY, intent);
}

/**
 * @returns {'signin' | 'signup' | null}
 */
export function consumeGoogleRedirectIntent() {
  const raw =
    safeGet(globalThis.sessionStorage, STORAGE_KEY) ||
    safeGet(globalThis.localStorage, STORAGE_KEY);
  safeRemove(globalThis.sessionStorage, STORAGE_KEY);
  safeRemove(globalThis.localStorage, STORAGE_KEY);
  if (raw === 'signin' || raw === 'signup') return raw;
  return null;
}

/**
 * @returns {'signin' | 'signup' | null}
 */
export function peekGoogleRedirectIntent() {
  const raw =
    safeGet(globalThis.sessionStorage, STORAGE_KEY) ||
    safeGet(globalThis.localStorage, STORAGE_KEY);
  if (raw === 'signin' || raw === 'signup') return raw;
  return null;
}
