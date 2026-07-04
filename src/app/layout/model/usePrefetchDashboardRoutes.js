import { useEffect } from 'react';

import { prefetchIdleDashboardRoutes } from './dashboardRouteModules';

/**
 * After the dashboard shell paints, prefetch sibling route chunks on an idle
 * tick so Safari/mobile tab switches don't block on dynamic import RTT.
 */
export function usePrefetchDashboardRoutes(pathname) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const run = () => prefetchIdleDashboardRoutes(pathname);

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(run, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(run, 400);
    return () => window.clearTimeout(timer);
  }, [pathname]);
}
