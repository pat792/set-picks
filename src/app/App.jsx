import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import RootAppShell from './layout/RootAppShell';
import HomeRoute from './routes/HomeRoute';

// Keep `HomeRoute` eager: it's the public splash / SEO-facing surface, so it
// must paint before any dynamic import resolves. Every other top-level route
// is lazy-loaded so direct hits on e.g. `/dashboard/profile` don't pay the
// full dashboard+admin+pools download on first paint. The shared Suspense
// boundary lives in `RootAppShell` (one place → consistent fallback).
const PasswordResetCompletePage = lazy(() =>
  import('../pages/auth/PasswordResetCompletePage')
);
const PublicProfilePage = lazy(() => import('../pages/profile/PublicProfilePage'));
const PoolInviteMissingCodePage = lazy(() =>
  import('../pages/pool-invite/PoolInviteMissingCodePage')
);
const PoolInvitePage = lazy(() => import('../pages/pool-invite/PoolInvitePage'));
const InviteLandingPage = lazy(() => import('../pages/invite/InviteLandingPage'));
const HowItWorksPage = lazy(() => import('../pages/marketing/HowItWorksPage'));
const HowScoringWorksPage = lazy(() => import('../pages/marketing/HowScoringWorksPage'));
const PrivacyPolicyPage = lazy(() => import('../pages/legal/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('../pages/legal/TermsOfServicePage'));
const SetupRoute = lazy(() => import('./routes/SetupRoute'));
const DashboardRoute = lazy(() => import('./routes/DashboardRoute'));
// Dev-only comms template gallery (redirects home in production builds).
const CommsPreviewPage = lazy(() => import('../pages/dev/CommsPreviewPage'));

function App() {
  return (
    <Routes>
      <Route element={<RootAppShell />}>
        {/* After email password reset — Firebase continueUrl (must stay public) */}
        <Route path="/password-reset-complete" element={<PasswordResetCompletePage />} />

        {/* Public player profile (e.g. from leaderboard links) */}
        <Route path="/user/:userId" element={<PublicProfilePage />} />

        {/* Marketing / educational pages — public, crawlable, no auth */}
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/how-scoring-works" element={<HowScoringWorksPage />} />

        {/* Legal pages — public, no auth (required for GCP OAuth consent screen) */}
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />

        {/* Public splash — no auth loading gate (WRS / SEO friendly) */}
        <Route path="/" element={<HomeRoute />} />

        {/* Pool invite: no code — drop stale breadcrumb */}
        <Route path="/join" element={<PoolInviteMissingCodePage />} />
        <Route path="/join/" element={<PoolInviteMissingCodePage />} />
        {/* Deep link — saves valid code and shows VIP landing (#580) */}
        <Route path="/join/:code" element={<PoolInvitePage />} />

        {/* Site VIP invite — no pool join side effects */}
        <Route path="/invite/:handle" element={<InviteLandingPage />} />

        {/* Dev-only: comms template preview gallery (no auth; prod redirects home) */}
        <Route path="/comms-preview" element={<CommsPreviewPage />} />

        <Route path="/setup" element={<SetupRoute />} />

        <Route path="/dashboard/*" element={<DashboardRoute />} />
      </Route>
    </Routes>
  );
}

export default App;
