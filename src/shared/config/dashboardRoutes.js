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

/**
 * Picks cluster — Make Picks / Picks Lab / Scorecard (#766).
 * `/dashboard` and `/dashboard/picks` are the same Make Picks form.
 */
export const PICKS_CLUSTER_PATHS = Object.freeze({
  home: '/dashboard',
  makePicks: '/dashboard/picks',
  lab: '/dashboard/picks/lab',
  scorecard: '/dashboard/picks/scorecard',
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

/**
 * True when pathname is any Picks-cluster surface (#766).
 * `/dashboard` and `/dashboard/picks` are both Make Picks.
 *
 * @param {string} pathname
 * @returns {boolean}
 */
export function isPicksClusterPath(pathname) {
  const path = normalizeDashboardPathname(pathname);
  if (path === PICKS_CLUSTER_PATHS.home) return true;
  if (path === PICKS_CLUSTER_PATHS.makePicks) return true;
  if (path === PICKS_CLUSTER_PATHS.lab) return true;
  if (path === PICKS_CLUSTER_PATHS.scorecard) return true;
  return false;
}

/**
 * True when pathname is the Make Picks form (`/dashboard` or `/dashboard/picks`).
 *
 * @param {string} pathname
 * @returns {boolean}
 */
export function isMakePicksPath(pathname) {
  const path = normalizeDashboardPathname(pathname);
  return path === PICKS_CLUSTER_PATHS.home || path === PICKS_CLUSTER_PATHS.makePicks;
}
