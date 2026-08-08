import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import {
  isMarketingTourStatsPath,
  scrollMarketingToTop,
} from '../model/scrollMarketingToTop';

/**
 * Reset window scroll on marketing client-side navigation (#925 / #920).
 *
 * Exception: `/tour-stats` ↔ `/tour-stats/:slug` keeps scroll depth (filter chrome).
 * Lives in `features/landing` so marketing never imports shared app `ScrollToTop`
 * / `appBootPath` (v1.55.3 Safari prerender hang class).
 */
export default function MarketingScrollToTop() {
  const { pathname, search } = useLocation();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    const prevPathname = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    const tourStatsSlugHandoff =
      prevPathname !== pathname &&
      isMarketingTourStatsPath(prevPathname) &&
      isMarketingTourStatsPath(pathname);

    if (tourStatsSlugHandoff) return;

    scrollMarketingToTop();
  }, [pathname, search]);

  return null;
}
