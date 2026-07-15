/**
 * Stable React key for `RootAppShell`'s enter-animation wrapper.
 *
 * Must not change on nested navigations within the same top-level route
 * (e.g. `/dashboard` → `/dashboard/profile`). A pathname-level key remounts
 * lazy route trees and re-triggers `<Suspense>` — Safari tab switches then
 * hang on the shared "Loading…" fallback.
 *
 * @param {string} pathname
 * @returns {string}
 */
export function shellTransitionKey(pathname) {
  const path = (pathname || '').replace(/\/+$/, '') || '/';
  if (path.startsWith('/dashboard')) return '/dashboard';
  if (path.startsWith('/join/')) return '/join/:code';
  if (path.startsWith('/invite/')) return '/invite/:handle';
  if (path.startsWith('/user/')) return '/user/:userId';
  return path;
}
