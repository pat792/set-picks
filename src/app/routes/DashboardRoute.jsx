import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import {
  trackAuthPartialProfile,
  useAuth,
} from '../../features/auth';

import { ShowCalendarProvider } from '../../features/show-calendar';
import { ensureAppCheckNow } from '../../shared/lib/firebaseAppCheck';
import { persistDashboardPath } from '../../shared/lib/dashboardLastPath';
import DashboardLayout from '../layout/DashboardLayout';
import DashboardBootSkeleton from '../layout/ui/DashboardBootSkeleton';
import { decideDashboardRoute } from './profileGuardDecision';

export default function DashboardRoute() {
  const location = useLocation();
  const { user, userProfile, loading } = useAuth();
  const decision = decideDashboardRoute({ loading, user, userProfile });

  // #535 / #773: belt-and-suspenders if soft-nav reached dashboard without boot warm.
  useEffect(() => {
    ensureAppCheckNow();
  }, []);

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

  // #535 / #830: remember intended path before bounce to `/login` so post-auth
  // lands on /dashboard/picks (etc.), not generic /dashboard. Do not send
  // unauthenticated visitors to marketing `/` (no AuthProvider there).
  if (decision.kind === 'redirect-home') {
    persistDashboardPath(location.pathname, location.search);
    return <Navigate to="/login" replace />;
  }

  // Keep branded chrome while session/profile resolve (#773) — no bare "Loading…".
  if (decision.kind === 'loading') return <DashboardBootSkeleton />;
  if (decision.kind === 'redirect-setup') {
    return <Navigate to="/setup" replace />;
  }

  return (
    <ShowCalendarProvider>
      <DashboardLayout />
    </ShowCalendarProvider>
  );
}
