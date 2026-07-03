import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import {
  AuthLoadingScreen,
  trackAuthPartialProfile,
  useAuth,
  useLegalReconsent,
} from '../../features/auth';
import { LegalReconsentModal } from '../../features/legal';

import { ShowCalendarProvider } from '../../features/show-calendar';
import DashboardLayout from '../layout/DashboardLayout';
import { decideDashboardRoute } from './profileGuardDecision';

export default function DashboardRoute() {
  const { user, userProfile, loading } = useAuth();
  const decision = decideDashboardRoute({ loading, user, userProfile });
  const {
    needsReconsent,
    accepted,
    setAccepted,
    accept,
    busy: reconsentBusy,
    error: reconsentError,
  } = useLegalReconsent(user, userProfile);

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

  return (
    <ShowCalendarProvider>
      <DashboardLayout />
      <LegalReconsentModal
        open={needsReconsent}
        accepted={accepted}
        onAcceptedChange={setAccepted}
        onAccept={accept}
        busy={reconsentBusy}
        error={reconsentError}
      />
    </ShowCalendarProvider>
  );
}
