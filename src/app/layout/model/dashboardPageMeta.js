/**
 * Centralized dashboard route metadata for consistent mobile context bar titles
 * and desktop heading ownership.
 *
 * When adding a `/dashboard/*` route, update this module, nav active-state rules
 * in `DashboardLayout.jsx`, and the verification script `scripts/verify-dashboard-meta.mjs`.
 * See `docs/DASHBOARD_IA.md`.
 */

import {
  NAV_LABEL_PICKS,
  NAV_LABEL_POOL_DETAILS,
  NAV_LABEL_STANDINGS,
  POOL_DETAILS_LAYOUT_EYEBROW,
  SHOW_STANDINGS_PAGE_HEADING,
} from '../../../shared/config/dashboardVocabulary.js';

/** Exported for `scripts/verify-dashboard-meta.mjs` (keep in sync with route paths). */
export function normalizeDashboardPathname(pathname) {
  const raw = pathname?.toString?.() || '';
  if (!raw.startsWith('/dashboard')) return raw;
  return raw.replace(/\/+$/, '') || '/dashboard';
}

export function getDashboardPageMeta(pathname) {
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
  const isAdmin = normalized === '/dashboard/admin';
  const isPoolHub = normalized.startsWith('/dashboard/pool/');

  const contextTitle = (() => {
    if (normalized === '/dashboard/standings') return NAV_LABEL_STANDINGS;
    if (normalized === '/dashboard/pools') return 'Your Pools';
    if (isPoolHub) return NAV_LABEL_POOL_DETAILS;
    if (isProfile) return 'My Profile';
    if (isAccountSecurity) return 'Sign-in & password';
    if (isAdmin) return 'War Room';
    return NAV_LABEL_PICKS;
  })();

  const showDatePicker =
    !isProfile && !isAccountSecurity && !isPoolHub;

  const layoutDesktopHeading =
    !isProfile && !isAccountSecurity && !isPoolHub
      ? contextTitle === NAV_LABEL_STANDINGS
        ? SHOW_STANDINGS_PAGE_HEADING
        : contextTitle
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
