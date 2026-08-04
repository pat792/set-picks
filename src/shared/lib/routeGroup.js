/**
 * Coarse route groups for field RUM / GA4 (#801).
 * Keep values stable — they are Exploration dimensions.
 *
 * @param {string} [pathname]
 * @returns {'splash' | 'login' | 'invite_join' | 'invite_site' | 'dashboard' | 'setup' | 'other'}
 */
export function resolveRouteGroup(pathname) {
  if (typeof pathname !== 'string' || !pathname) return 'other';
  if (pathname === '/') return 'splash';
  if (pathname === '/login' || pathname.startsWith('/login/')) return 'login';
  if (pathname === '/setup' || pathname.startsWith('/setup/')) return 'setup';
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return 'dashboard';
  }
  if (pathname.startsWith('/join')) return 'invite_join';
  if (pathname.startsWith('/invite/')) return 'invite_site';
  return 'other';
}
