import React from 'react';
import { Navigate } from 'react-router-dom';

import { AuthLoadingScreen, useAuth } from '../../features/auth';
import { getDashboardEntryHref } from '../../shared/lib/dashboardLastPath';

import ProfileSetupPage from '../../pages/auth/ProfileSetupPage';
import { decideSetupRoute } from './profileGuardDecision';

export default function SetupRoute() {
  const { user, userProfile, loading, isAdmin: isAdminUser } = useAuth();
  const decision = decideSetupRoute({ loading, user, userProfile });

  if (decision.kind === 'loading') return <AuthLoadingScreen />;
  if (decision.kind === 'redirect-home') return <Navigate to="/" replace />;
  if (decision.kind === 'redirect-dashboard') {
    return <Navigate to={getDashboardEntryHref({ isAdminUser })} replace />;
  }
  return <ProfileSetupPage user={user} />;
}
