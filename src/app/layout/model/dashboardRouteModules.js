import { isProfileClusterPath } from '../../../shared/config/dashboardRoutes';

/**
 * Dynamic import factories for **secondary** dashboard routes only.
 *
 * Primary nav tabs (Picks, Pools, Standings, Profile) are static imports in
 * `DashboardLayout` so `<Routes>` tab switches never unmount into an empty
 * Suspense boundary — Safari shows "Loading…" on every lazy swap otherwise.
 *
 * Keep specifiers in sync with `lazy()` usage in `DashboardLayout.jsx`.
 */
export const dashboardLazyRouteImport = {
  admin: () => import('../../../pages/admin/AdminPage'),
  account: () => import('../../../pages/profile/AccountPage'),
  poolHub: () => import('../../../pages/pools/PoolHubPage'),
  notifications: () => import('../../../pages/notifications/NotificationsPage'),
  tourStats: () => import('../../../pages/tour-stats/TourStatsPage'),
};

/** Nav path → lazy route keys to warm before navigation. */
export const DASHBOARD_NAV_PRELOAD_BY_PATH = Object.freeze({
  '/dashboard/admin': ['admin'],
  '/dashboard/standings': ['tourStats'],
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
    const load = dashboardLazyRouteImport[key];
    if (!load) continue;
    started.add(key);
    load().catch(() => {
      started.delete(key);
    });
  }
}

/**
 * @param {string} pathname
 * @returns {string[]}
 */
export function dashboardLazyRouteKeysForPathname(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/dashboard';
  if (path.startsWith('/dashboard/pool/')) return ['poolHub'];
  if (path === '/dashboard/admin') return ['admin'];
  if (path === '/dashboard/tour-stats') return ['tourStats'];
  if (isProfileClusterPath(path)) {
    const keys = [];
    if (path.includes('/notifications')) keys.push('notifications');
    if (path.includes('/account')) keys.push('account');
    return keys;
  }
  return [];
}

/**
 * Warm every lazy dashboard route chunk except those already on screen.
 *
 * @param {string} pathname
 */
export function prefetchIdleDashboardRoutes(pathname) {
  const exclude = new Set(dashboardLazyRouteKeysForPathname(pathname));
  const keys = Object.keys(dashboardLazyRouteImport).filter((key) => !exclude.has(key));
  prefetchDashboardRoutes(keys);
}

/** Eagerly warm all lazy dashboard chunks (secondary routes). */
export function prefetchAllLazyDashboardRoutes() {
  prefetchDashboardRoutes(Object.keys(dashboardLazyRouteImport));
}
