import {
  PROFILE_CLUSTER_LEGACY_PATHS,
  PROFILE_CLUSTER_PATHS,
  normalizeDashboardPathname,
} from './dashboardRoutes.js';

/** Summer Tour 2026 marketing email CTA (`content/comms/lifecycle/summer-tour-2026-launch.md`). */
export const MARKETING_INSTALL_HOWTO_UTM_CONTENT = 'install_howto';

/**
 * @param {string} [search]
 * @returns {URLSearchParams}
 */
function parseSearch(search) {
  if (!search) return new URLSearchParams();
  const raw = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(raw);
}

/**
 * @param {string} pathname
 * @param {URLSearchParams} params
 * @returns {string}
 */
function withSearch(pathname, params) {
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Resolve pre-#418 paths and marketing deep links to canonical dashboard routes.
 * Used on cold entry in `DashboardRoute` (before the heavy dashboard shell mounts)
 * and mirrored by in-layout `<Navigate>` routes for same-session SPA nav.
 *
 * @param {string} pathname
 * @param {string} [search]
 * @returns {string | null} Redirect target (path + query) or null when unchanged.
 */
export function resolveDashboardLegacyRedirect(pathname, search = '') {
  const path = normalizeDashboardPathname(pathname);
  const params = parseSearch(search);

  if (path === PROFILE_CLUSTER_LEGACY_PATHS.notifications) {
    return withSearch(PROFILE_CLUSTER_PATHS.notifications, params);
  }

  if (path === PROFILE_CLUSTER_LEGACY_PATHS.accountSecurity) {
    return withSearch(PROFILE_CLUSTER_PATHS.account, params);
  }

  if (path === PROFILE_CLUSTER_PATHS.profile) {
    if (params.get('openPush') === '1' || params.get('section') === 'push') {
      const next = new URLSearchParams(params);
      next.delete('openPush');
      if (next.get('section') === 'push') next.delete('section');
      next.set('openPush', '1');
      return withSearch(PROFILE_CLUSTER_PATHS.notifications, next);
    }

    if (
      params.get('install') === '1' ||
      params.get('utm_content') === MARKETING_INSTALL_HOWTO_UTM_CONTENT
    ) {
      const next = new URLSearchParams(params);
      next.delete('install');
      next.set('install', '1');
      return withSearch('/dashboard', next);
    }
  }

  return null;
}

/**
 * Canonical in-app install + push how-to entry for new marketing copy.
 *
 * @param {string} [siteUrl]
 * @param {Record<string, string>} [extraParams]
 * @returns {string}
 */
export function buildMarketingInstallHowToUrl(
  siteUrl = 'https://www.setlistpickem.com',
  extraParams = {},
) {
  const base = siteUrl.replace(/\/+$/, '');
  const params = new URLSearchParams({
    install: '1',
    utm_source: 'email',
    utm_campaign: 'summer_tour_2026_launch',
    utm_content: MARKETING_INSTALL_HOWTO_UTM_CONTENT,
    ...extraParams,
  });
  return `${base}/dashboard?${params.toString()}`;
}
