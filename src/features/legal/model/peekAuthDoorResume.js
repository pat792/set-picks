/**
 * Peek auth-door resume kind without importing the auth feature graph
 * (legal pages boot on the marketing document — keep the chunk light).
 *
 * Storage key must stay in sync with
 * `features/auth/utils/splashAuthResumeStorage.js` (`splashResumeAuthModal`).
 *
 * @returns {'signup' | 'signin' | null}
 */
export function peekAuthDoorResume() {
  try {
    const raw = sessionStorage.getItem('splashResumeAuthModal');
    if (raw === 'signup' || raw === 'signin') return raw;
  } catch {
    // Private mode / blocked storage.
  }
  return null;
}
