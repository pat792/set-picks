import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import {
  isSplashGoogleModalInflight,
  SPLASH_GOOGLE_MODAL_STORAGE_EVENT,
  useAuth,
} from '../../features/auth';
import { getDashboardEntryHref } from '../../shared/lib/dashboardLastPath';

import LandingPage from '../../pages/landing/LandingPage';

/**
 * Public home: paint immediately for crawlers; redirect to dashboard once auth proves a session.
 */
export default function HomeRoute() {
  const { user, isAdmin: isAdminUser } = useAuth();
  const [, bump] = useState(0);

  useEffect(() => {
    const onInflight = () => bump((n) => n + 1);
    window.addEventListener(SPLASH_GOOGLE_MODAL_STORAGE_EVENT, onInflight);
    return () => window.removeEventListener(SPLASH_GOOGLE_MODAL_STORAGE_EVENT, onInflight);
  }, []);

  // Stay on landing while a splash Google popup is finishing — otherwise
  // `HomeRoute` redirects before sign-in-modal block-new-user can setError.
  if (user && !isSplashGoogleModalInflight()) {
    return <Navigate to={getDashboardEntryHref({ isAdminUser })} replace />;
  }

  return <LandingPage />;
}
