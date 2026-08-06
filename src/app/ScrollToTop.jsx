import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { isPublicTourStatsPath } from '../shared/lib/appBootPath';
import { scrollAppToTop } from '../shared/lib/scrollAppToTop';

/**
 * Reset window + dashboard `main` scroll on client-side navigation.
 * Dashboard routes scroll inside `#dashboard-scrollport`, not the window —
 * so window-only reset left Standings → Picks (etc.) stuck mid-page.
 * Primary nav also calls {@link scrollAppToTop} on click for same-tab re-taps.
 *
 * Exception: public `/tour-stats` ↔ `/tour-stats/:slug` filter changes stay at the
 * current scroll depth (same page chrome). Other menu routes still jump to top.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    const prevPathname = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    const tourStatsSlugHandoff =
      prevPathname !== pathname &&
      isPublicTourStatsPath(prevPathname) &&
      isPublicTourStatsPath(pathname);

    if (tourStatsSlugHandoff) return;

    scrollAppToTop();
  }, [pathname, search]);

  return null;
}
