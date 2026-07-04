import { useEffect } from 'react';

import {
  prefetchAllLazyDashboardRoutes,
  prefetchIdleDashboardRoutes,
} from './dashboardRouteModules';

/**
 * After the dashboard shell mounts, prefetch secondary (lazy) route chunks.
 * Primary nav tabs are static imports — no Suspense on tab switch.
 */
export function usePrefetchDashboardRoutes(pathname) {
  useEffect(() => {
    prefetchAllLazyDashboardRoutes();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const run = () => prefetchIdleDashboardRoutes(pathname);

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(run, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(run, 200);
    return () => window.clearTimeout(timer);
  }, [pathname]);
}
