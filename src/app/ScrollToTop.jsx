import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { scrollAppToTop } from '../shared/lib/scrollAppToTop';

/**
 * Reset window + dashboard `main` scroll on client-side navigation.
 * Dashboard routes scroll inside `#dashboard-scrollport`, not the window —
 * so window-only reset left Standings → Picks (etc.) stuck mid-page.
 * Primary nav also calls {@link scrollAppToTop} on click for same-tab re-taps.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    scrollAppToTop();
  }, [pathname, search]);

  return null;
}
