import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { ga4SendPageView } from '../shared/lib/ga4';

/**
 * Sends a GA4 page_view on client-side route changes (SPA).
 */
export default function Ga4RouteListener() {
  const location = useLocation();

  useEffect(() => {
    const page = `${location.pathname}${location.search}`;
    ga4SendPageView(page);
  }, [location.pathname, location.search]);

  return null;
}
