/**
 * Centralized dashboard route metadata for consistent mobile context bar titles
 * and desktop heading ownership.
 */

import {
  NAV_LABEL_POOL_DETAILS,
  NAV_LABEL_STANDINGS,
  POOL_DETAILS_LAYOUT_EYEBROW,
  SHOW_STANDINGS_PAGE_HEADING,
} from '../../../shared/config/dashboardVocabulary';

export function getDashboardPageMeta(pathname) {
  const normalized = pathname?.toString?.() || '';

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
  const isScoringRules = normalized === '/dashboard/scoring';
  const isPoolHub = normalized.startsWith('/dashboard/pool/');

  const contextTitle = (() => {
    if (normalized === '/dashboard/standings') return NAV_LABEL_STANDINGS;
    if (normalized === '/dashboard/pools') return 'Your Pools';
    if (isPoolHub) return NAV_LABEL_POOL_DETAILS;
    if (isProfile) return 'My Profile';
    if (isAccountSecurity) return 'Sign-in & password';
    if (isAdmin) return 'War Room';
    if (isScoringRules) return 'Scoring rules';
    return 'Make Picks';
  })();

  const showDatePicker =
    !isProfile && !isAccountSecurity && !isScoringRules && !isPoolHub;

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

