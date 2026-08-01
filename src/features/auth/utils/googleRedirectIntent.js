const STORAGE_KEY = 'setpicks_google_redirect_intent_v1';

/**
 * Stash which splash modal started a Google redirect (#773 Phase 2b).
 * @param {'signin' | 'signup'} intent
 */
export function stashGoogleRedirectIntent(intent) {
  if (intent !== 'signin' && intent !== 'signup') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, intent);
  } catch {
    // ignore quota / private mode
  }
}

/**
 * @returns {'signin' | 'signup' | null}
 */
export function consumeGoogleRedirectIntent() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (raw === 'signin' || raw === 'signup') return raw;
  } catch {
    // ignore
  }
  return null;
}

/**
 * @returns {'signin' | 'signup' | null}
 */
export function peekGoogleRedirectIntent() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === 'signin' || raw === 'signup') return raw;
  } catch {
    // ignore
  }
  return null;
}
