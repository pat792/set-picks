/**
 * Centralized dashboard route metadata for consistent mobile context bar titles
 * and desktop heading ownership.
 */

export function getDashboardPageMeta(pathname) {
  const normalized = pathname?.toString?.() || '';

  // Defaults for safety (should only render within /dashboard/* routes).
  if (!normalized.startsWith('/dashboard')) {
    return {
      contextTitle: '',
      showDatePicker: false,
      layoutDesktopHeading: null,
      desktopHeadingTone: 'default',
    };
  }

  const isProfile = normalized === '/dashboard/profile';
  const isAccountSecurity = normalized === '/dashboard/account-security';
  const isAdmin = normalized === '/dashboard/admin';
  const isScoringRules = normalized === '/dashboard/scoring';

  const contextTitle = (() => {
    if (normalized === '/dashboard/standings') return 'Standings';
    if (normalized === '/dashboard/pools') return 'Your Pools';
    if (isProfile) return 'My Profile';
    if (isAccountSecurity) return 'Sign-in & password';
    if (isAdmin) return 'War Room';
    if (isScoringRules) return 'Scoring rules';
    return 'Make Picks';
  })();

  const showDatePicker = !isProfile && !isAccountSecurity && !isScoringRules;

  const layoutDesktopHeading = !isProfile && !isAccountSecurity ? contextTitle : null;

  return {
    contextTitle,
    showDatePicker,
    layoutDesktopHeading,
    desktopHeadingTone: isAdmin ? 'warRoom' : 'default',
  };
}

