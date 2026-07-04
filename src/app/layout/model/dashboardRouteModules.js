import { isProfileClusterPath } from '../../../shared/config/dashboardRoutes';

/**
 * Dynamic import factories for dashboard nested routes. Shared by
 * `DashboardLayout`'s `lazy()` wrappers and idle/hover prefetch so the
 * module loader cache is warm before the user navigates (Safari SPA nav).
 *
 * Keep specifiers in sync with any `lazy()` usage in `DashboardLayout.jsx`.
 */
export const dashboardRouteImport = {
  picks: () => import('../../../pages/picks/PicksPage'),
  admin: () => import('../../../pages/admin/AdminPage'),
  standings: () => import('../../../pages/standings/StandingsPage'),
  profile: () => import('../../../pages/profile/ProfilePage'),
  account: () => import('../../../pages/profile/AccountPage'),
  pools: () => import('../../../pages/pools/PoolsPage'),
  poolHub: () => import('../../../pages/pools/PoolHubPage'),
  notifications: () => import('../../../pages/notifications/NotificationsPage'),
};

/** Nav path → route module keys to warm before navigation. */
export const DASHBOARD_NAV_PRELOAD_BY_PATH = Object.freeze({
  '/dashboard': ['picks'],
  '/dashboard/pools': ['pools'],
  '/dashboard/standings': ['standings'],
  '/dashboard/profile': ['profile'],
  '/dashboard/admin': ['admin'],
});

const started = new Set();

/**
 * @param {string | string[]} keys
 */
export function prefetchDashboardRoutes(keys) {
  if (typeof window === 'undefined') return;
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    if (started.has(key)) continue;
    const load = dashboardRouteImport[key];
    if (!load) continue;
    started.add(key);
    load().catch(() => {
      started.delete(key);
    });
  }
}

/**
 * Keys for the currently mounted dashboard nested route (for idle prefetch
 * exclusion so we don't re-fetch the active tab's chunk).
 *
 * @param {string} pathname
 * @returns {string[]}
 */
export function dashboardRouteKeysForPathname(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/dashboard';
  if (path === '/dashboard' || path === '/dashboard/picks') return ['picks'];
  if (path === '/dashboard/pools') return ['pools'];
  if (path.startsWith('/dashboard/pool/')) return ['poolHub'];
  if (path === '/dashboard/standings') return ['standings'];
  if (path === '/dashboard/admin') return ['admin'];
  if (isProfileClusterPath(path)) {
    const keys = ['profile'];
    if (path.includes('/notifications')) keys.push('notifications');
    if (path.includes('/account')) keys.push('account');
    return keys;
  }
  return [];
}

/**
 * Warm every dashboard route chunk except those already on screen.
 *
 * @param {string} pathname
 */
export function prefetchIdleDashboardRoutes(pathname) {
  const exclude = new Set(dashboardRouteKeysForPathname(pathname));
  const keys = Object.keys(dashboardRouteImport).filter((key) => !exclude.has(key));
  prefetchDashboardRoutes(keys);
}
