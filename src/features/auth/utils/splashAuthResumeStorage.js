const STORAGE_KEY = 'splashResumeAuthModal';

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
