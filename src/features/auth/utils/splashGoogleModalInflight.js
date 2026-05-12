/**
 * While a splash auth modal is resolving `signInWithPopup`, Firebase briefly
 * sets `auth.currentUser`. `HomeRoute` would otherwise `<Navigate>` to the
 * dashboard immediately, unmounting the modal before sign-in-modal new-user
 * block logic can run `deleteUser` + `setError` (PR #406).
 *
 * Set this flag synchronously before awaiting `signInWithGoogle`, clear in
 * `finally` when the handler completes.
 */
const KEY = 'setlistpickem_splash_google_modal_inflight';

/** Same-tab signal so `HomeRoute` re-renders after storage changes (sessionStorage does not notify). */
export const SPLASH_GOOGLE_MODAL_STORAGE_EVENT = 'setlistpickem:splash-google-modal-inflight';

function notifyInflightChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SPLASH_GOOGLE_MODAL_STORAGE_EVENT));
}

export function setSplashGoogleModalInflight() {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
  notifyInflightChanged();
}

export function clearSplashGoogleModalInflight() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  notifyInflightChanged();
}

export function isSplashGoogleModalInflight() {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
