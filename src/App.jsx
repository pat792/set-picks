import Header from './features/layout/Header';
import SidebarMenu from './features/layout/SidebarMenu';
import PicksForm from './features/picks/PicksForm';
import Leaderboard from './features/pools/Leaderboard';
import AdminForm from './features/admin/AdminForm.jsx';
import Splash from './features/landing/Splash'; 

import React, { useState } from 'react';
import { signInWithPopup } from "firebase/auth";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { auth, googleProvider } from './lib/firebase';
import { useAuth } from './features/auth/useAuth';
import { usePoolData } from './features/pools/usePoolData';

const ADMIN_EMAIL = "pat@road2media.com";

const PHISH_SONGS = [
  "2001", "46 Days", "AC/DC Bag", "Antelope", "Bathtub Gin", "Blaze On", "Cavern", 
  "Carini", "Character Zero", "Chalk Dust Torture", "Divided Sky", "Down with Disease", 
  "Everything's Right", "Fluffhead", "Free", "Ghost", "Gotta Jibboo", "Guyute", 
  "Harry Hood", "I Am Hydrogen", "Llama", "Maze", "Mike's Song", "No Men In No Man's Land", 
  "Piper", "Possum", "Prince Caspian", "Reba", "Runaway Jim", "Sand", "Say It To Me S.A.N.T.O.S.", 
  "Slave to the Traffic Light", "Stash", "The Moma Dance", "Tweezer", "Tweezer Reprise", 
  "Twist", "Weekapaug Groove", "Wolfman's Brother", "You Enjoy Myself"
].sort();

const queryClient = new QueryClient();

export default function App() {
  const { user, userProfile, loading } = useAuth();
  
  const [activeTab, setActiveTab] = useState("picks");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { poolPicks, actualSetlist, adminResults } = usePoolData(selectedDate);

  const getTotalScore = (uPicks) => {
    if (!actualSetlist) return null;
    let total = 0;
    ['s1o', 's1c', 's2o', 's2c', 'enc', 'wild'].forEach(f => {
      if (actualSetlist[f]?.toLowerCase() === uPicks[f]?.toLowerCase()) total += 1;
      else if (Object.values(actualSetlist).some(s => s?.toLowerCase() === uPicks[f]?.toLowerCase())) total += 0.5;
    });
    return total;
  };

  const formFields = [
    { label: "S1 Opener", id: "s1o" }, { label: "S1 Closer", id: "s1c" },
    { label: "S2 Opener", id: "s2o" }, { label: "S2 Closer", id: "s2c" },
    { label: "Encore", id: "enc" }, { label: "Wildcard", id: "wild" },
  ];

  // Applied 'fixed inset-0' to lock the background in place
  if (loading) return <div className="fixed inset-0 bg-[#0f172a] flex items-center justify-center text-white font-black italic text-2xl uppercase tracking-tighter">Loading Phish Pool...</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={!user ? <Splash onLogin={() => signInWithPopup(auth, googleProvider)} /> : <Navigate to="/dashboard" replace />} 
          />

          <Route 
            path="/dashboard" 
            element={
              user ? (
                // Applied 'fixed inset-0 overflow-y-auto overscroll-none' to make it feel like a true native app
                <div className="fixed inset-0 bg-[#0f172a] text-white font-sans selection:bg-blue-500/30 overflow-y-auto overscroll-none">
                  <Header selectedDate={selectedDate} setSelectedDate={setSelectedDate} activeTab={activeTab} onTabChange={setActiveTab} onOpenMenu={() => setIsMenuOpen(true)} />
                  
                  <main className="max-w-xl mx-auto px-6 pb-24 pt-8">
                    {activeTab === "picks" && <PicksForm selectedDate={selectedDate} user={user} userProfile={userProfile} formFields={formFields} PHISH_SONGS={PHISH_SONGS} />}
                    
                    {activeTab === "pools" && (
                      <div className="text-center py-20 bg-slate-800/50 rounded-[2.5rem] border border-white/5">
                        <h2 className="text-2xl font-black italic uppercase text-slate-500">Pools Coming Soon</h2>
                        <p className="text-slate-600 text-xs mt-2 font-bold uppercase tracking-widest">Global Pool is currently the only active room.</p>
                      </div>
                    )}

                    {activeTab === "leaderboard" && <Leaderboard poolPicks={poolPicks} actualSetlist={actualSetlist} getTotalScore={getTotalScore} formFields={formFields} />}
                    
                    {activeTab === "admin" && user.email === ADMIN_EMAIL && <AdminForm selectedDate={selectedDate} initialResults={adminResults} formFields={formFields} PHISH_SONGS={PHISH_SONGS} />}
                  </main>
                  
                  <SidebarMenu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} userProfile={userProfile} user={user} ADMIN_EMAIL={ADMIN_EMAIL} activeTab={activeTab} setActiveTab={setActiveTab} auth={auth} />
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}