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
 * Defer FCM service-worker registration until idle on non-app hard opens.
 * Dashboard/setup keep immediate registration (push surfaces).
 * @param {string} [pathname]
 * @returns {boolean}
 */
export function shouldDeferMessagingServiceWorker(pathname) {
  if (typeof pathname !== 'string' || !pathname) return true;
  return !isDashboardEntryPath(pathname) && pathname !== '/setup';
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

/**
 * Should boot kick off the `DashboardRoute` import (#804)?
 *
 * Dashboard hard opens always do. Public cold-open surfaces only do when a
 * persisted session hint says the visitor is about to be redirected there —
 * anonymous visitors must not pay for the dashboard graph on splash.
 *
 * @param {string} [pathname]
 * @param {{ hasSession?: boolean }} [opts]
 * @returns {boolean}
 */
export function shouldPrefetchDashboardOnBoot(pathname, opts = {}) {
  if (typeof pathname !== 'string' || !pathname) return false;
  if (isDashboardEntryPath(pathname)) return true;
  if (!opts.hasSession) return false;
  return pathname === '/' || pathname === '/setup' || isPublicColdOpenPath(pathname);
}
