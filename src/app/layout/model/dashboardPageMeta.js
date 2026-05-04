/**
 * Centralized dashboard route metadata for consistent mobile context bar titles
 * and desktop heading ownership.
 *
 * When adding a `/dashboard/*` route, update this module, nav active-state rules
 * in `DashboardLayout.jsx`, and the verification script `scripts/verify-dashboard-meta.mjs`.
 * See `docs/DASHBOARD_IA.md`.
 */

import {
  NAV_LABEL_ACCOUNT_SECURITY,
  NAV_LABEL_NOTIFICATIONS,
  NAV_LABEL_PICKS,
  NAV_LABEL_POOL_DETAILS,
  NAV_LABEL_POOLS,
  NAV_LABEL_PROFILE,
  NAV_LABEL_STANDINGS,
  POOL_DETAILS_LAYOUT_EYEBROW,
} from '../../../shared/config/dashboardVocabulary.js';

/** Exported for `scripts/verify-dashboard-meta.mjs` (keep in sync with route paths). */
export function normalizeDashboardPathname(pathname) {
  const raw = pathname?.toString?.() || '';
  if (!raw.startsWith('/dashboard')) return raw;
  return raw.replace(/\/+$/, '') || '/dashboard';
}

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

  const isProfile = normalized === '/dashboard/profile';
  const isAccountSecurity = normalized === '/dashboard/account-security';
  const isNotifications = normalized === '/dashboard/notifications';
  const isAdmin = normalized === '/dashboard/admin';
  const isPoolHub = normalized.startsWith('/dashboard/pool/');
  const isStandings = normalized === '/dashboard/standings';
  const isStandingsTourView =
    isStandings && readViewQuery(search) === 'tour';

  const contextTitle = (() => {
    if (isStandings) return NAV_LABEL_STANDINGS;
    if (normalized === '/dashboard/pools') return NAV_LABEL_POOLS;
    if (isPoolHub) return NAV_LABEL_POOL_DETAILS;
    if (isProfile) return NAV_LABEL_PROFILE;
    if (isAccountSecurity) return NAV_LABEL_ACCOUNT_SECURITY;
    if (isNotifications) return NAV_LABEL_NOTIFICATIONS;
    if (isAdmin) return 'War Room';
    return NAV_LABEL_PICKS;
  })();

  const showDatePicker =
    !isProfile &&
    !isAccountSecurity &&
    !isNotifications &&
    !isPoolHub &&
    !isStandingsTourView;

  const layoutDesktopHeading =
    !isProfile && !isAccountSecurity && !isNotifications && !isPoolHub
      ? contextTitle
      : null;

  const layoutDetailEyebrow = isPoolHub ? POOL_DETAILS_LAYOUT_EYEBROW : null;

  return {
    contextTitle,
    showDatePicker,
    layoutDesktopHeading,
    layoutDetailEyebrow,
    desktopHeadingTone: isAdmin ? 'warRoom' : 'default',
  };
}
