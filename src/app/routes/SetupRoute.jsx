import React from 'react';
import { Navigate } from 'react-router-dom';

import { AuthLoadingScreen, useAuth } from '../../features/auth';
import { getDashboardEntryHref } from '../../shared/lib/dashboardLastPath';
import HardRedirect from '../../shared/ui/HardRedirect';

import ProfileSetupPage from '../../pages/auth/ProfileSetupPage';
import { decideSetupRoute } from './profileGuardDecision';

export default function SetupRoute() {
  const { user, userProfile, loading, isAdmin: isAdminUser } = useAuth();
  const decision = decideSetupRoute({ loading, user, userProfile });

  if (decision.kind === 'loading') return <AuthLoadingScreen />;
  // #830 / #881: unauth setup → thin login document (hard-nav).
  if (decision.kind === 'redirect-home') return <HardRedirect to="/login" />;
  if (decision.kind === 'redirect-dashboard') {
    return <Navigate to={getDashboardEntryHref({ isAdminUser })} replace />;
  }
  return <ProfileSetupPage user={user} />;
}
