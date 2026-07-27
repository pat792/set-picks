import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { DASHBOARD_SCROLLPORT_ID } from '../shared/hooks/useDashboardMobileChromePortal';

/**
 * Reset window + dashboard `main` scroll on client-side navigation.
 * Dashboard routes scroll inside `#dashboard-scrollport`, not the window —
 * so window-only reset left Standings → Picks (etc.) stuck mid-page.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const dashboardScrollport = document.getElementById(DASHBOARD_SCROLLPORT_ID);
    if (dashboardScrollport) {
      dashboardScrollport.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}
