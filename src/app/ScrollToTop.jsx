import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Reset window scroll on client-side navigation so deep-linked legal pages and
 * other routes always open at the top (React Router does not do this by default).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
