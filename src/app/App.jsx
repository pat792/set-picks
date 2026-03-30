import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';

// Components
import SplashPage from '../pages/landing/SplashPage';
import ProfileSetupPage from '../pages/auth/ProfileSetupPage';
import PasswordResetCompletePage from '../pages/auth/PasswordResetCompletePage';
import DashboardLayout from './layout/DashboardLayout';
import PublicProfilePage from '../pages/profile/PublicProfilePage';

function App() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center font-bold">Loading...</div>;
  }

  return (
    <Routes>
      {/* After email password reset — Firebase continueUrl (must stay public) */}
      <Route path="/password-reset-complete" element={<PasswordResetCompletePage />} />

      {/* Public player profile (e.g. from leaderboard links) */}
      <Route path="/user/:userId" element={<PublicProfilePage />} />

      {/* Route 1: The Public Splash Page */}
      <Route 
        path="/" 
        element={!user ? <SplashPage /> : <Navigate to="/dashboard" replace />} 
      />

      {/* Route 2: The Profile Setup Gatekeeper */}
      <Route 
        path="/setup" 
        element={
          !user ? <Navigate to="/" replace /> : 
          userProfile ? <Navigate to="/dashboard" replace /> : 
          <ProfileSetupPage user={user} />
        } 
      />

      {/* Route 3: The Main Application Shell */}
      <Route 
        path="/dashboard/*" 
        element={
          !user ? <Navigate to="/" replace /> :
          !userProfile ? <Navigate to="/setup" replace /> :
          <DashboardLayout />  // <-- REPLACED TEMPDASHBOARD WITH THIS
        } 
      />
    </Routes>
  );
}

export default App;