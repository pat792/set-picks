import React from 'react';
import { Navigate } from 'react-router-dom';

import { AuthLoadingScreen, useAuth } from '../../features/auth';
import { getDashboardEntryHref } from '../../shared/lib/dashboardLastPath';

import ProfileSetupPage from '../../pages/auth/ProfileSetupPage';

export default function SetupRoute() {
  const { user, userProfile, loading, isAdmin: isAdminUser } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (userProfile) {
    return <Navigate to={getDashboardEntryHref({ isAdminUser })} replace />;
  }

  return <ProfileSetupPage user={user} />;
}
