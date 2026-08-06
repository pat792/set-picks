/** Session key shared with legal back-nav (`features/legal` peeks the same key). */
export const SPLASH_RESUME_AUTH_MODAL_KEY = 'splashResumeAuthModal';
const STORAGE_KEY = SPLASH_RESUME_AUTH_MODAL_KEY;

/**
 * Call before navigating away from splash/login auth to Terms/Privacy so
 * browser Back can restore signup/signin on `/login` (or splash handoff).
 * Session-only.
 * @param {'signup' | 'signin'} kind
 */
export function stashSplashResumeAuthModal(kind) {
  if (kind !== 'signup' && kind !== 'signin') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, kind);
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Read without clearing — legal pages use this for “Back to create account”
 * while browser Back still consumes on `/login` (#908 follow-up).
 * @returns {'signup' | 'signin' | null}
 */
export function peekSplashResumeAuthModal() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === 'signup' || raw === 'signin') return raw;
  } catch {
    // ignore
  }
  return null;
}

/**
 * @returns {'signup' | 'signin' | null}
 */
export function consumeSplashResumeAuthModal() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (raw === 'signup' || raw === 'signin') return raw;
  } catch {
    // ignore
  }
  return null;
}
