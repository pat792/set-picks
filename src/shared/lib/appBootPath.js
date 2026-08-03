/**
 * Path helpers for cold-boot warming on app / email hard opens (#773 Phase 2).
 * #803: anonymous `/` `/join` `/invite` keep deferred App Check; session +
 * dashboard/setup still warm immediately.
 */

/**
 * @param {string} [pathname]
 * @returns {boolean}
 */
export function isDashboardEntryPath(pathname) {
  if (typeof pathname !== 'string' || !pathname) return false;
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
}

/**
 * Public cold-open surfaces where anonymous visitors should not pay reCAPTCHA
 * before first paint / auth CTA (#803). Returning sessions warm via AuthContext.
 * @param {string} [pathname]
 * @returns {boolean}
 */
export function isPublicColdOpenPath(pathname) {
  if (typeof pathname !== 'string' || !pathname) return false;
  return (
    pathname === '/' ||
    pathname.startsWith('/join') ||
    pathname.startsWith('/invite/')
  );
}

/**
 * Surfaces that need Firestore ASAP on hard open (skip App Check idle deferral).
 * Invite/join anonymous paths are intentionally excluded (#803) — warm on
 * persisted session or auth modal open instead.
 * @param {string} [pathname]
 * @returns {boolean}
 */
export function shouldWarmAppCheckOnBoot(pathname) {
  if (typeof pathname !== 'string' || !pathname) return false;
  return isDashboardEntryPath(pathname) || pathname === '/setup';
}
