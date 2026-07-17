/**
 * Centralized dashboard route metadata for consistent mobile context bar titles
 * and desktop heading ownership.
 *
 * When adding a `/dashboard/*` route, update this module, nav active-state rules
 * in `DashboardLayout.jsx`, and the verification script `scripts/verify-dashboard-meta.mjs`.
 * See `docs/DASHBOARD_IA.md`.
 */

import {
  NAV_LABEL_ACCOUNT,
  NAV_LABEL_MESSAGES,
  NAV_LABEL_PICKS,
  NAV_LABEL_POOL_DETAILS,
  NAV_LABEL_POOLS,
  NAV_LABEL_PROFILE,
  NAV_LABEL_STANDINGS,
  NAV_LABEL_TOUR_STATS,
  POOL_DETAILS_LAYOUT_EYEBROW,
} from '../../../shared/config/dashboardVocabulary.js';
import {
  PROFILE_CLUSTER_LEGACY_PATHS,
  PROFILE_CLUSTER_PATHS,
  isProfileClusterPath,
  normalizeDashboardPathname,
} from '../../../shared/config/dashboardRoutes.js';

/** Exported for `scripts/verify-dashboard-meta.mjs` (keep in sync with route paths). */
export { normalizeDashboardPathname };

/**
 * Read the `?view=` query from a search string or URLSearchParams.
 * Tolerant to `undefined` / object forms so the Dashboard layout can
 * pass `location.search` straight through.
 */
function readViewQuery(search) {
  if (!search) return '';
  try {
    const params =
      typeof search === 'string' ? new URLSearchParams(search) : search;
    return params.get?.('view')?.toString?.() || '';
  } catch {
    return '';
  }
}

/**
 * @param {string} pathname
 * @param {string | URLSearchParams | null | undefined} [search]  `location.search`.
 *   Used by `/dashboard/standings` to hide the global date picker when
 *   `?view=tour` is active (#255) — tour standings are cumulative, so
 *   a date selector has no meaning there.
 */
export function getDashboardPageMeta(pathname, search) {
  const normalized = normalizeDashboardPathname(pathname);

  // Defaults for safety (should only render within /dashboard/* routes).
  if (!normalized.startsWith('/dashboard')) {
    return {
      contextTitle: '',
      showDatePicker: false,
      layoutDesktopHeading: null,
      layoutDetailEyebrow: null,
      desktopHeadingTone: 'default',
    };
  }

  const isProfileIdentity = normalized === PROFILE_CLUSTER_PATHS.profile;
  const isProfileMessages =
    normalized === PROFILE_CLUSTER_PATHS.notifications ||
    normalized === PROFILE_CLUSTER_LEGACY_PATHS.notifications;
  const isProfileAccount =
    normalized === PROFILE_CLUSTER_PATHS.account ||
    normalized === PROFILE_CLUSTER_LEGACY_PATHS.accountSecurity;
  const isProfileCluster = isProfileClusterPath(normalized);
  const isAdmin = normalized === '/dashboard/admin';
  const isPoolHub = normalized.startsWith('/dashboard/pool/');
  const isStandings = normalized === '/dashboard/standings';
  const isTourStats = normalized === '/dashboard/tour-stats';
  const isStandingsTourView =
    isStandings && readViewQuery(search) === 'tour';

  const contextTitle = (() => {
    if (isStandings) return NAV_LABEL_STANDINGS;
    if (isTourStats) return NAV_LABEL_TOUR_STATS;
    if (normalized === '/dashboard/pools') return NAV_LABEL_POOLS;
    if (isPoolHub) return NAV_LABEL_POOL_DETAILS;
    if (isProfileIdentity) return NAV_LABEL_PROFILE;
    if (isProfileMessages) return NAV_LABEL_MESSAGES;
    if (isProfileAccount) return NAV_LABEL_ACCOUNT;
    if (isAdmin) return 'War Room';
    return NAV_LABEL_PICKS;
  })();

  const showDatePicker =
    !isProfileCluster && !isPoolHub && !isStandingsTourView && !isTourStats;

  // Profile cluster + pool details own in-page headings; Standings owns a sticky
  // title + Show/Tour/Pools chrome (#552 follow-up) so layout does not duplicate H1.
  const layoutDesktopHeading =
    !isProfileCluster && !isPoolHub && !isStandings ? contextTitle : null;

  const layoutDetailEyebrow = isPoolHub ? POOL_DETAILS_LAYOUT_EYEBROW : null;

  return {
    contextTitle,
    showDatePicker,
    isStandingsTourView,
    layoutDesktopHeading,
    layoutDetailEyebrow,
    desktopHeadingTone: isAdmin ? 'warRoom' : 'default',
  };
}
