import { DASHBOARD_SCROLLPORT_ID } from '../hooks/useDashboardMobileChromePortal';

/**
 * Reset window scroll and the dashboard `main` overflow scrollport.
 * Use on route changes and primary nav clicks (including same-tab re-taps).
 */
export function scrollAppToTop() {
  window.scrollTo(0, 0);
  const dashboardScrollport = document.getElementById(DASHBOARD_SCROLLPORT_ID);
  if (dashboardScrollport) {
    dashboardScrollport.scrollTop = 0;
  }
}
