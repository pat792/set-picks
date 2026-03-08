import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// --- FIREBASE CONFIG ---
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

// --- SONG LIST FOR PREDICTIVE TEXT ---
const PHISH_SONGS = [
  "2001", "46 Days", "AC/DC Bag", "Antelope", "Bathtub Gin", "Blaze On", "Cavern", 
  "Carini", "Character Zero", "Chalk Dust Torture", "Divided Sky", "Down with Disease", 
  "Everything's Right", "Fluffhead", "Free", "Ghost", "Gotta Jibboo", "Guyute", 
  "Harry Hood", "I Am Hydrogen", "Llama", "Maze", "Mike's Song", "No Men In No Man's Land", 
  "Piper", "Possum", "Prince Caspian", "Reba", "Runaway Jim", "Sand", "Say It To Me S.A.N.T.O.S.", 
  "Slave to the Traffic Light", "Stash", "The Moma Dance", "Tweezer", "Tweezer Reprise", 
  "Twist", "Weekapaug Groove", "Wolfman's Brother", "You Enjoy Myself"
].sort();

export default function App() {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("picks");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");
  
  // Track which input field the user is currently typing in
  const [focusedField, setFocusedField] = useState(null);

  // Track the current picks
  const [picks, setPicks] = useState({
    s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: ""
  });

  // --- AUTH & PROFILE LOAD ---
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (userDoc.exists()) setUserProfile(userDoc.data());
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
  }, []);

  // --- SAVE NEW USER HANDLE ---
  const saveHandle = async (handle) => {
    if (!handle.trim()) return;
    const profile = { 
      handle, 
      email: user.email, 
      stats: { totalPoints: 0, showsPlayed: 0 },
      pools: ["GLOBAL"] 
    };
    await setDoc(doc(db, "users", user.uid), profile);
    setUserProfile(profile);
  };

  // --- SAVE PICKS TO DATABASE ---
  const handleSavePicks = async () => {
    setSaveStatus("Saving...");
    try {
      const pickId = `${selectedDate}_${user.uid}`;
      await setDoc(doc(db, "picks", pickId), {
        ...picks,
        uid: user.uid,
        handle: userProfile.handle,
        date: selectedDate,
        updatedAt: new Date().toISOString()
      });
      setSaveStatus("✅ Picks Locked In!");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      console.error("Error saving picks:", error);
      setSaveStatus("❌ Error saving picks.");
    }
  };

  // --- LOADING SCREEN ---
  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black italic">LOADING...</div>;

  // --- LOGIN SCREEN ---
  if (!user) return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 scale-150">⭕</div>
      <h1 className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">PHISH POOL</h1>
      <p className="text-slate-500 font-bold tracking-[0.3em] text-[10px] mb-12">PREDICT THE JAMS. WIN THE GLORY.</p>
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-white text-black px-10 py-4 rounded-full font-black flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105 transition-all">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />
        SIGN IN WITH GOOGLE
      </button>
    </div>
  );

  // --- CHOOSE HANDLE SCREEN ---
  if (!userProfile) return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6">
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 w-full max-w-sm text-center space-y-4">
        <h2 className="text-2xl font-bold">Pick your Handle</h2>
        <input 
          id="handleInput"
          className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-center text-xl font-bold"
          placeholder="Username..."
        />
        <button 
          onClick={() => saveHandle(document.getElementById('handleInput').value)} 
          className="w-full bg-blue-600 py-4 rounded-xl font-black">
          START PLAYING
        </button>
      </div>
    </div>
  );

  // --- MAIN APP DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-blue-500/30">
      
      {/* SIDEBAR / HAMBURGER MENU */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-slate-800 shadow-2xl z-50 transform transition-transform duration-300 border-l border-slate-700 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-8 h-full flex flex-col">
          <button onClick={() => setIsMenuOpen(false)} className="self-end text-slate-400 text-2xl font-light">✕</button>
          
          <div className="mt-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full mx-auto flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">👤</div>
            <h2 className="text-2xl font-black mt-4">{userProfile?.handle || "Phan"}</h2>
            <p className="text-xs font-bold text-blue-400 tracking-widest uppercase mt-1">Veteran Player</p>
          </div>

          <div className="mt-12 space-y-4 flex-grow">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-500">Total Points</span>
              <span className="text-xl font-black text-emerald-400">{userProfile?.stats?.totalPoints || 0}</span>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-500">Shows Played</span>
              <span className="text-xl font-black text-blue-400">{userProfile?.stats?.showsPlayed || 0}</span>
            </div>
          </div>

          <button onClick={() => signOut(auth)} className="w-full py-4 bg-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest text-red-400 border border-red-900/20">Sign Out</button>
        </div>
      </div>

      {/* TOP NAV */}
      <header className="px-6 py-8 flex justify-between items-center max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-blue-400 flex items-center gap-2">
            <span className="text-blue-500">⭕</span> PHISH POOL
          </h1>
        </div>
        <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 flex flex-col justify-center items-center gap-1 bg-slate-800 rounded-xl border border-slate-700">
          <div className="w-5 h-0.5 bg-white"></div>
          <div className="w-5 h-0.5 bg-white"></div>
          <div className="w-3 h-0.5 bg-white self-start ml-2.5"></div>
        </button>
      </header>

      <main className="max-w-xl mx-auto px-6 pb-32">
        
        {/* DATE PICKER & POOL SELECTOR */}
        <section className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-[2.5rem] mb-8">
          <div className="grid grid-cols-2 gap-6 items-end">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 mb-2 block tracking-widest">Select Concert Date</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 mb-2 block tracking-widest">Active Pool</label>
              <div className="flex gap-2">
                <input placeholder="Code..." className="w-full bg-slate-900 border border-slate-700 p-3 rounded-2xl text-sm font-bold uppercase focus:border-blue-500 outline-none" />
                <button className="bg-blue-600 px-4 rounded-2xl font-black text-xs">JOIN</button>
              </div>
            </div>
          </div>
        </section>

        {/* TABS CONTENT */}
        {activeTab === "picks" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black italic">MY PICKS</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase">1pt Spot / 0.5pt Anywhere</p>
            </div>
            
            <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-700 space-y-5">
              {[
                { label: "Set 1 Opener", id: "s1o" },
                { label: "Set 1 Closer", id: "s1c" },
                { label: "Set 2 Opener", id: "s2o" },
                { label: "Set 2 Closer", id: "s2c" },
                { label: "Encore", id: "enc" },
                { label: "Wildcard (>1 yr)", id: "wild" },
              ].map(f => {
                // Determine if we should show the custom dropdown for this specific field
                const showDropdown = focusedField === f.id && picks[f.id].length > 0;
                // Filter the songs based on what the user typed
                const filteredSongs = PHISH_SONGS.filter(song => 
                  song.toLowerCase().includes(picks[f.id].toLowerCase())
                );

                return (
                  <div key={f.id} className="relative">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-1 block">{f.label}</label>
                    <input 
                      placeholder="Start typing a song..."
                      value={picks[f.id]}
                      onChange={(e) => setPicks({ ...picks, [f.id]: e.target.value })}
                      onFocus={() => setFocusedField(f.id)}
                      onBlur={() => setTimeout(() => setFocusedField(null), 150)}
                      className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-colors" 
                    />
                    
                    {/* CUSTOM AUTOCOMPLETE DROPDOWN */}
                    {showDropdown && filteredSongs.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto overflow-hidden">
                        {filteredSongs.map(song => (
                          <div 
                            key={song} 
                            onClick={() => {
                              setPicks({ ...picks, [f.id]: song });
                              setFocusedField(null);
                            }}
                            className="p-4 text-sm font-bold border-b border-slate-700/50 hover:bg-slate-700 cursor-pointer last:border-0"
                          >
                            {song}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              
              <button 
                onClick={handleSavePicks}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 py-5 rounded-3xl font-black tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-transform mt-4">
                {saveStatus || "LOCK IN PICKS"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="space-y-4">
            <h2 className="text-xl font-black italic px-2">LEADERBOARD</h2>
            <div className="bg-slate-800/80 rounded-[2.5rem] border border-slate-700 overflow-hidden">
               <div className="p-8 text-center text-slate-500 italic text-sm font-bold">No results for {selectedDate} yet.</div>
            </div>
          </div>
        )}

        {activeTab === "pools" && (
          <div className="space-y-4">
            <h2 className="text-xl font-black italic px-2">MY POOLS</h2>
            <div className="bg-slate-800/80 rounded-[2.5rem] border border-slate-700 p-8 text-center">
              <div className="text-4xl mb-4">🤝</div>
              <p className="text-slate-400 text-sm font-bold">You are currently in the GLOBAL pool.</p>
              <p className="text-slate-500 text-xs mt-2">Private pool creation coming soon!</p>
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex gap-1 shadow-2xl z-40">
        {[
          { id: "picks", label: "Picks", icon: "🎟️" },
          { id: "leaderboard", label: "Rankings", icon: "🏆" },
          { id: "pools", label: "Pools", icon: "🤝" },
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-8 py-3 rounded-full flex items-center gap-2 transition-all ${activeTab === t.id ? "bg-white text-black font-black" : "text-slate-400 hover:text-white"}`}
          >
            <span className="text-lg">{t.icon}</span>
            <span className="text-[10px] uppercase font-bold tracking-tighter">{t.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}
