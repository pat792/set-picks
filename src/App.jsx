import Header from './features/layout/Header';
import SidebarMenu from './features/layout/SidebarMenu'; // <-- NEW IMPORT
import PicksForm from './features/picks/PicksForm';
import Leaderboard from './features/pools/Leaderboard';
import AdminForm from './features/admin/AdminForm.jsx';
import Splash from './features/landing/Splash'; 

import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const firebaseConfig = {
  apiKey: "AIzaSyAJskQFM62Fyr-EjxlGJD3svAhf9gp9CHI",
  authDomain: "set-picks.firebaseapp.com",
  projectId: "set-picks",
  storageBucket: "set-picks.firebasestorage.app",
  messagingSenderId: "927420107250",
  appId: "1:927420107250:web:1b9f52a72ef8dd9096836b",
  measurementId: "G-K3YZ8FNM3V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

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
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("picks");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");
  const [poolPicks, setPoolPicks] = useState([]);
  const [actualSetlist, setActualSetlist] = useState(null);
  const [picks, setPicks] = useState({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });
  const [adminResults, setAdminResults] = useState({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserProfile(userSnap.data());
      } else { setUser(null); setUserProfile(null); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "picks"), where("date", "==", selectedDate));
    const unsubscribePicks = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() }));
      setPoolPicks(fetched);
    });
    const unsubscribeResults = onSnapshot(doc(db, "results", selectedDate), (docSnap) => {
      if (docSnap.exists()) { setActualSetlist(docSnap.data()); setAdminResults(docSnap.data()); }
      else { setActualSetlist(null); setAdminResults({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" }); }
    });
    return () => { unsubscribePicks(); unsubscribeResults(); };
  }, [selectedDate]);

  const handleSavePicks = async () => {
    setSaveStatus("Saving...");
    try {
      const pickId = `${selectedDate}_${user.uid}`;
      await setDoc(doc(db, "picks", pickId), { ...picks, uid: user.uid, handle: userProfile.handle, date: selectedDate, updatedAt: new Date().toISOString() });
      setSaveStatus("✅ Picks Locked In!");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (e) { setSaveStatus("❌ Error."); }
  };

  const handleSaveResults = async () => {
    setSaveStatus("Publishing...");
    try {
      await setDoc(doc(db, "results", selectedDate), { ...adminResults, date: selectedDate, updatedAt: new Date().toISOString() });
      setSaveStatus("🏆 Results Published!");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (e) { setSaveStatus("❌ Error."); }
  };

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

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-black italic text-2xl uppercase tracking-tighter">Loading Phish Pool...</div>;

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
                <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-blue-500/30">
                  <Header 
                    selectedDate={selectedDate} 
                    setSelectedDate={setSelectedDate} 
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onOpenMenu={() => setIsMenuOpen(true)}
                  />
                  
                  <main className="max-w-xl mx-auto px-6 pb-24 pt-8">
                    {activeTab === "picks" && <PicksForm picks={picks} setPicks={setPicks} formFields={formFields} PHISH_SONGS={PHISH_SONGS} handleSavePicks={handleSavePicks} saveStatus={saveStatus} />}
                    
                    {activeTab === "pools" && (
                      <div className="text-center py-20 bg-slate-800/50 rounded-[2.5rem] border border-white/5">
                        <h2 className="text-2xl font-black italic uppercase text-slate-500">Pools Coming Soon</h2>
                        <p className="text-slate-600 text-xs mt-2 font-bold uppercase tracking-widest">Global Pool is currently the only active room.</p>
                      </div>
                    )}

                    {activeTab === "leaderboard" && <Leaderboard poolPicks={poolPicks} actualSetlist={actualSetlist} getTotalScore={getTotalScore} formFields={formFields} />}
                    
                    {activeTab === "admin" && user.email === ADMIN_EMAIL && <AdminForm adminResults={adminResults} setAdminResults={setAdminResults} formFields={formFields} handleSaveResults={handleSaveResults} saveStatus={saveStatus} PHISH_SONGS={PHISH_SONGS} />}
                  </main>
                  
                  {/* BRAND NEW SIDEBAR COMPONENT */}
                  <SidebarMenu 
                    isMenuOpen={isMenuOpen} 
                    setIsMenuOpen={setIsMenuOpen} 
                    userProfile={userProfile} 
                    user={user} 
                    ADMIN_EMAIL={ADMIN_EMAIL} 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    auth={auth} 
                  />
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