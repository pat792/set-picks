import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/useAuth';

// Components
import Splash from './features/landing/Splash';
import ProfileSetup from './features/auth/ProfileSetup';
import PasswordResetComplete from './features/auth/PasswordResetComplete';
import DashboardLayout from './features/layout/DashboardLayout'; // <-- NEW IMPORT
import PublicProfile from './features/profile/PublicProfile';

function App() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center font-bold">Loading...</div>;
  }

  return (
    <Routes>
      {/* After email password reset — Firebase continueUrl (must stay public) */}
      <Route path="/password-reset-complete" element={<PasswordResetComplete />} />

      {/* Public player profile (e.g. from leaderboard links) */}
      <Route path="/user/:userId" element={<PublicProfile />} />

      {/* Route 1: The Public Splash Page */}
      <Route 
        path="/" 
        element={!user ? <Splash /> : <Navigate to="/dashboard" replace />} 
      />

      {/* Route 2: The Profile Setup Gatekeeper */}
      <Route 
        path="/setup" 
        element={
          !user ? <Navigate to="/" replace /> : 
          userProfile ? <Navigate to="/dashboard" replace /> : 
          <ProfileSetup user={user} />
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