import { useEffect, useLayoutEffect, useState } from 'react';

/** Shared mount point in `DashboardLayout` mobile header stack (tools band). */
export const DASHBOARD_MOBILE_FIXED_CHROME_ROOT_ID =
  'dashboard-mobile-fixed-chrome-root';

/** Dashboard `main` overflow scrollport — reset on route change (see ScrollToTop). */
export const DASHBOARD_SCROLLPORT_ID = 'dashboard-scrollport';

/** Desktop sticky stack slot for cluster title + tertiary tray. */
export const DASHBOARD_DESKTOP_PAGE_CHROME_ROOT_ID =
  'dashboard-desktop-page-chrome-root';

/** Trailing slot in the mobile context bar (e.g. Standings Scoring rules). */
export const DASHBOARD_MOBILE_CONTEXT_TRAILING_ROOT_ID =
  'dashboard-mobile-context-trailing-root';

/**
 * Resolves the layout portal target for per-page mobile fixed chrome
 * (Standings / Picks / Pools / Profile — nested under the context bar).
 *
 * @returns {HTMLElement | null}
 */
export function useDashboardMobileChromePortal() {
  const [root, setRoot] = useState(null);

  useEffect(() => {
    setRoot(document.getElementById(DASHBOARD_MOBILE_FIXED_CHROME_ROOT_ID));
  }, []);

  return root;
}

/**
 * Resolves the desktop sticky page-chrome portal (title + tray).
 *
 * @returns {HTMLElement | null}
 */
export function useDashboardDesktopPageChromePortal() {
  const [root, setRoot] = useState(null);

  useLayoutEffect(() => {
    setRoot(document.getElementById(DASHBOARD_DESKTOP_PAGE_CHROME_ROOT_ID));
  }, []);

  return root;
}

/**
 * Resolves the context-bar trailing portal (right-justified utility actions).
 *
 * @returns {HTMLElement | null}
 */
export function useDashboardMobileContextTrailingPortal() {
  const [root, setRoot] = useState(null);

  useEffect(() => {
    setRoot(document.getElementById(DASHBOARD_MOBILE_CONTEXT_TRAILING_ROOT_ID));
  }, []);

  return root;
}
