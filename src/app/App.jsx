import React from 'react';
import { Routes, Route } from 'react-router-dom';

import PasswordResetCompletePage from '../pages/auth/PasswordResetCompletePage';
import PublicProfilePage from '../pages/profile/PublicProfilePage';

import DashboardRoute from './routes/DashboardRoute';
import HomeRoute from './routes/HomeRoute';
import SetupRoute from './routes/SetupRoute';
import PoolInvitePage from '../pages/pool-invite/PoolInvitePage';

function App() {
  return (
    <Routes>
      {/* After email password reset — Firebase continueUrl (must stay public) */}
      <Route path="/password-reset-complete" element={<PasswordResetCompletePage />} />

      {/* Public player profile (e.g. from leaderboard links) */}
      <Route path="/user/:userId" element={<PublicProfilePage />} />

      {/* Public splash — no auth loading gate (WRS / SEO friendly) */}
      <Route path="/" element={<HomeRoute />} />

      {/* Pool invite deep link — saves code and sends user through auth funnel */}
      <Route path="/join/:code" element={<PoolInvitePage />} />

      <Route path="/setup" element={<SetupRoute />} />

      <Route path="/dashboard/*" element={<DashboardRoute />} />
    </Routes>
  );
}

export default App;
