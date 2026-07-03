/**
 * Canonical dashboard path constants and cluster membership helpers.
 * Used by nav active-state, page meta, last-path restore, and deep links.
 *
 * @see docs/DASHBOARD_IA.md
 * @see docs/RELEASE_TRAIN_SPRINT_5_6.md (#418)
 */

/** Profile cluster — identity, messages (inbox/prefs), account. */
export const PROFILE_CLUSTER_PATHS = Object.freeze({
  profile: '/dashboard/profile',
  notifications: '/dashboard/profile/notifications',
  account: '/dashboard/profile/account',
});

/** Pre-#418 paths; SPA redirects preserve bookmarks and email deep links. */
export const PROFILE_CLUSTER_LEGACY_PATHS = Object.freeze({
  notifications: '/dashboard/notifications',
  accountSecurity: '/dashboard/account-security',
});

/**
 * @param {string} pathname
 * @returns {string}
 */
export function normalizeDashboardPathname(pathname) {
  const raw = pathname?.toString?.() || '';
  if (!raw.startsWith('/dashboard')) return raw;
  return raw.replace(/\/+$/, '') || '/dashboard';
}

/**
 * True when pathname is any Profile-cluster surface (including legacy redirects).
 *
 * @param {string} pathname
 * @returns {boolean}
 */
export function isProfileClusterPath(pathname) {
  const path = normalizeDashboardPathname(pathname);
  if (path === PROFILE_CLUSTER_PATHS.profile) return true;
  if (path === PROFILE_CLUSTER_PATHS.notifications) return true;
  if (path === PROFILE_CLUSTER_PATHS.account) return true;
  if (path === PROFILE_CLUSTER_LEGACY_PATHS.notifications) return true;
  if (path === PROFILE_CLUSTER_LEGACY_PATHS.accountSecurity) return true;
  return path.startsWith(`${PROFILE_CLUSTER_PATHS.profile}/`);
}
