import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import {
  AuthLoadingScreen,
  trackAuthPartialProfile,
  useAuth,
} from '../../features/auth';

import { ShowCalendarProvider } from '../../features/show-calendar';
import { resolveDashboardLegacyRedirect } from '../../shared/config/dashboardLegacyRedirects';
import DashboardLayout from '../layout/DashboardLayout';
import { decideDashboardRoute } from './profileGuardDecision';

export default function DashboardRoute() {
  const location = useLocation();
  const { user, userProfile, loading } = useAuth();
  const decision = decideDashboardRoute({ loading, user, userProfile });
  const legacyRedirect = resolveDashboardLegacyRedirect(
    location.pathname,
    location.search,
  );

  // Anomaly signal for the consent-only orphan regression (May 2026).
  // Keyed on uid so a single mount fires once per user, even across
  // StrictMode double-invokes (GA4 helper additionally dedupes within
  // 120ms). See `docs/AUTH_TELEMETRY_RUNBOOK.md`.
  const partialProfile =
    decision.kind === 'redirect-setup' && decision.telemetry === 'partial_profile';
  const hasConsent = Boolean(userProfile?.termsPrivacyAcceptedAt);
  useEffect(() => {
    if (!partialProfile) return;
    trackAuthPartialProfile({
      has_consent: hasConsent,
      surface: 'dashboard_route',
    });
  }, [partialProfile, hasConsent, user?.uid]);

  if (decision.kind === 'loading') return <AuthLoadingScreen />;
  if (decision.kind === 'redirect-home') return <Navigate to="/" replace />;
  if (decision.kind === 'redirect-setup') {
    return <Navigate to="/setup" replace />;
  }
  if (legacyRedirect) {
    return <Navigate to={legacyRedirect} replace />;
  }

  return (
    <ShowCalendarProvider>
      <DashboardLayout />
    </ShowCalendarProvider>
  );
}
