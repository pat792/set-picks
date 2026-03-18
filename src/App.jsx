import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/useAuth'; // Adjust path if needed

// Components
import Splash from './features/landing/Splash';
import ProfileSetup from './features/auth/ProfileSetup';
// We will replace this div with your actual Dashboard Layout in the next step
const TempDashboard = () => <div className="text-white text-center mt-20 text-3xl font-bold">Welcome to the Dashboard!</div>; 

function App() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center font-bold">Loading...</div>;
  }

  return (
    <Routes>
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

      {/* Route 3: The Main Application */}
      <Route 
        path="/dashboard/*" 
        element={
          !user ? <Navigate to="/" replace /> :
          !userProfile ? <Navigate to="/setup" replace /> :
          <TempDashboard /> 
        } 
      />
    </Routes>
  );
}

export default App;