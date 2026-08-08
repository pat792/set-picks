/**
 * Marketing-document scroll helpers (#925 slice 2 / #920).
 *
 * Window-only — do not import `scrollAppToTop` (dashboard scrollport) or
 * `appBootPath` onto the marketing cold-open graph (Safari hydrate regression).
 */

/**
 * @param {string} [pathname]
 * @returns {boolean}
 */
export function isMarketingTourStatsPath(pathname) {
  if (typeof pathname !== 'string' || !pathname) return false;
  return pathname === '/tour-stats' || pathname.startsWith('/tour-stats/');
}

/** Reset window scroll on marketing soft-nav (no dashboard scrollport). */
export function scrollMarketingToTop() {
  window.scrollTo(0, 0);
}
