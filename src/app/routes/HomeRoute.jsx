import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../../features/auth';

import LandingPage from '../../pages/landing/LandingPage';

/**
 * Public home: paint immediately for crawlers; redirect to dashboard once auth proves a session.
 */
export default function HomeRoute() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
}
