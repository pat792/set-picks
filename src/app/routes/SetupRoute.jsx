import React from 'react';
import { Navigate } from 'react-router-dom';

import { AuthLoadingScreen, useAuth } from '../../features/auth';

import ProfileSetupPage from '../../pages/auth/ProfileSetupPage';

export default function SetupRoute() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (userProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  return <ProfileSetupPage user={user} />;
}
