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
const SetupRoute = lazy(() => import('./routes/SetupRoute'));
const DashboardRoute = lazy(() => import('./routes/DashboardRoute'));

function App() {
  return (
    <Routes>
      <Route element={<RootAppShell />}>
        {/* After email password reset — Firebase continueUrl (must stay public) */}
        <Route path="/password-reset-complete" element={<PasswordResetCompletePage />} />

        {/* Public player profile (e.g. from leaderboard links) */}
        <Route path="/user/:userId" element={<PublicProfilePage />} />

        {/* Public splash — no auth loading gate (WRS / SEO friendly) */}
        <Route path="/" element={<HomeRoute />} />

        {/* Pool invite: no code — drop stale breadcrumb */}
        <Route path="/join" element={<PoolInviteMissingCodePage />} />
        <Route path="/join/" element={<PoolInviteMissingCodePage />} />
        {/* Deep link — saves valid code and sends user through auth funnel */}
        <Route path="/join/:code" element={<PoolInvitePage />} />

        <Route path="/setup" element={<SetupRoute />} />

        <Route path="/dashboard/*" element={<DashboardRoute />} />
      </Route>
    </Routes>
  );
}

export default App;
