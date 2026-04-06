/**
 * Remember last dashboard URL for post-auth entry (see HomeRoute / post-login redirects).
 * Paths are validated; admin paths restore only for admin users.
 *
 * Profile and account-security are excluded: users often open Profile only to sign out;
 * remembering that route would send them back to Profile after every login.
 */

import { getLocalStorageItem, setLocalStorageItem } from './local-storage';

export const DASHBOARD_LAST_PATH_STORAGE_KEY = 'setpicks_dash_last_loc_v1';

/** Query string must be empty or ?key=value&... with safe characters only. */
function isSafeDashboardSearch(search) {
  if (search == null || search === '') return true;
  if (typeof search !== 'string' || !search.startsWith('?')) return false;
  return /^[?][A-Za-z0-9_%.+\-=&]*$/.test(search);
}

export function normalizeDashboardPathname(pathname) {
  if (pathname === '/dashboard/') return '/dashboard';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '');
  }
  return pathname;
}

/**
 * @param {string} pathname
 * @param {string} [search]
 * @param {{ isAdminUser?: boolean }} [opts]
 */
export function isRestorableDashboardPath(pathname, search = '', opts = {}) {
  const { isAdminUser = false } = opts;
  const path = normalizeDashboardPathname(pathname);
  if (!path.startsWith('/dashboard')) return false;
  if (!isSafeDashboardSearch(search)) return false;

  if (path === '/dashboard/profile' || path === '/dashboard/account-security') {
    return false;
  }

  if (path === '/dashboard') return true;
  if (path === '/dashboard/pools') return true;
  if (path === '/dashboard/standings') return true;
  if (path === '/dashboard/scoring') return true;
  if (path === '/dashboard/admin') return isAdminUser;
  if (/^\/dashboard\/pool\/[A-Za-z0-9_-]+$/.test(path)) return true;
  return false;
}

/**
 * @param {string} pathname
 * @param {string} [search]
 * @param {{ isAdminUser?: boolean }} [opts]
 */
export function shouldPersistDashboardPath(pathname, search = '', opts = {}) {
  return isRestorableDashboardPath(pathname, search, opts);
}

/**
 * @param {{ isAdminUser?: boolean }} [opts]
 * @returns {string} path + search for <Navigate to={...} /> or location.assign
 */
export function getDashboardEntryHref(opts = {}) {
  const raw = getLocalStorageItem(DASHBOARD_LAST_PATH_STORAGE_KEY);
  if (!raw) return '/dashboard';
  try {
    const data = JSON.parse(raw);
    const pathname = data?.pathname;
    const search = typeof data?.search === 'string' ? data.search : '';
    if (typeof pathname !== 'string') return '/dashboard';
    if (!isRestorableDashboardPath(pathname, search, opts)) return '/dashboard';
    const p = normalizeDashboardPathname(pathname);
    return p + (search.startsWith('?') ? search : search ? `?${search}` : '');
  } catch {
    return '/dashboard';
  }
}

/**
 * @param {string} pathname
 * @param {string} [search]
 * @param {{ isAdminUser?: boolean }} [opts]
 */
export function persistDashboardPath(pathname, search = '', opts = {}) {
  if (!shouldPersistDashboardPath(pathname, search, opts)) return;
  const p = normalizeDashboardPathname(pathname);
  const s = search && search.startsWith('?') ? search : search ? `?${search}` : '';
  setLocalStorageItem(
    DASHBOARD_LAST_PATH_STORAGE_KEY,
    JSON.stringify({ pathname: p, search: s })
  );
}
