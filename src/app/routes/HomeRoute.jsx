import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../../features/auth';
import { getDashboardEntryHref } from '../../shared/lib/dashboardLastPath';

import LandingPage from '../../pages/landing/LandingPage';

/**
 * Public home: paint immediately for crawlers; redirect to dashboard once auth proves a session.
 */
export default function HomeRoute() {
  const { user } = useAuth();
  const isAdminUser = user?.email === 'pat@road2media.com';

  if (user) {
    return <Navigate to={getDashboardEntryHref({ isAdminUser })} replace />;
  }

  return <LandingPage />;
}
