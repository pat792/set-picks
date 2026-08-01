/**
 * Path helpers for cold-boot warming on app / email hard opens (#773 Phase 2).
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
 * Surfaces that need Firestore ASAP on hard open (skip App Check idle deferral).
 * @param {string} [pathname]
 * @returns {boolean}
 */
export function shouldWarmAppCheckOnBoot(pathname) {
  if (typeof pathname !== 'string' || !pathname) return false;
  return (
    isDashboardEntryPath(pathname) ||
    pathname === '/setup' ||
    pathname.startsWith('/join') ||
    pathname.startsWith('/invite/')
  );
}
