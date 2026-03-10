import Header from './src/components/layout/Header';
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot } from "firebase/firestore";

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

// 🚨 ADMIN EMAIL CONFIGURED 🚨
const ADMIN_EMAIL = "pat@road2media.com";

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
  
  const [focusedField, setFocusedField] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [expandedUser, setExpandedUser] = useState(null);

  const [picks, setPicks] = useState({
    s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: ""
  });
  
  const [adminResults, setAdminResults] = useState({
    s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: ""
  });

  const [poolPicks, setPoolPicks] = useState([]);
  const [actualSetlist, setActualSetlist] = useState(null);

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

  // --- FETCH LIVE POOL PICKS & MASTER SETLIST ---
  useEffect(() => {
    if (!db) return;
    
    const q = query(collection(db, "picks"), where("date", "==", selectedDate));
    const unsubscribePicks = onSnapshot(q, (snapshot) => {
      const fetchedPicks = [];
      snapshot.forEach((doc) => {
        fetchedPicks.push({ id: doc.id, ...doc.data() });
      });
      setPoolPicks(fetchedPicks);
    });

    const unsubscribeResults = onSnapshot(doc(db, "results", selectedDate), (docSnap) => {
      if (docSnap.exists()) {
        setActualSetlist(docSnap.data());
        setAdminResults(docSnap.data());
      } else {
        setActualSetlist(null);
        setAdminResults({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });
      }
    });

    return () => {
      unsubscribePicks();
      unsubscribeResults();
    };
  }, [selectedDate]);

  // --- SAVE NEW USER HANDLE ---
  const saveHandle = async (handle) => {
    if (!handle.trim()) return;
    const profile = { handle, email: user.email, stats: { totalPoints: 0, showsPlayed: 0 }, pools: ["GLOBAL"] };
    await setDoc(doc(db, "users", user.uid), profile);
    setUserProfile(profile);
  };

  // --- SAVE USER PICKS TO DATABASE ---
  const handleSavePicks = async () => {
    setSaveStatus("Saving...");
    try {
      const pickId = `${selectedDate}_${user.uid}`;
      await setDoc(doc(db, "picks", pickId), { ...picks, uid: user.uid, handle: userProfile.handle, date: selectedDate, updatedAt: new Date().toISOString() });
      setSaveStatus("✅ Picks Locked In!");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      setSaveStatus("❌ Error saving picks.");
    }
  };

  // --- SAVE ADMIN MASTER SETLIST TO DATABASE ---
  const handleSaveResults = async () => {
    setSaveStatus("Publishing Results...");
    try {
      await setDoc(doc(db, "results", selectedDate), { ...adminResults, date: selectedDate, updatedAt: new Date().toISOString() });
      setSaveStatus("🏆 Setlist Published!");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      setSaveStatus("❌ Error saving results.");
    }
  };

  // --- MOCK API FETCH FOR SCAFFOLDING ---
  const handleFetchFromPhishNet = () => {
    setSaveStatus("Fetching from Phish.net...");
    setTimeout(() => {
      setSaveStatus("📡 API Integration Coming Soon!");
      setTimeout(() => setSaveStatus(""), 3000);
    }, 1500);
  };

  // --- SCORING ENGINE ---
  const getPointValue = (fieldId, guessedSong) => {
    if (!actualSetlist || !guessedSong) return null;
    if (actualSetlist[fieldId].toLowerCase() === guessedSong.toLowerCase()) return 1;
    const allPlayedSongs = [actualSetlist.s1o, actualSetlist.s1c, actualSetlist.s2o, actualSetlist.s2c, actualSetlist.enc, actualSetlist.wild].map(s => s.toLowerCase());
    if (allPlayedSongs.includes(guessedSong.toLowerCase())) return 0.5;
    return 0;
  };

  const getTotalScore = (userPicks) => {
    if (!actualSetlist) return null;
    let total = 0;
    ['s1o', 's1c', 's2o', 's2c', 'enc', 'wild'].forEach(f => {
      const pts = getPointValue(f, userPicks[f]);
      if (pts) total += pts;
    });
    return total;
  };

  // --- LOADING & LOGIN ---
  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black italic">LOADING...</div>;

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

  if (!userProfile) return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6">
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 w-full max-w-sm text-center space-y-4">
        <h2 className="text-2xl font-bold">Pick your Handle</h2>
        <input id="handleInput" className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-center text-xl font-bold" placeholder="Username..." />
        <button onClick={() => saveHandle(document.getElementById('handleInput').value)} className="w-full bg-blue-600 py-4 rounded-xl font-black">START PLAYING</button>
      </div>
    </div>
  );

  const formFields = [
    { label: "S1 Opener", id: "s1o" },
    { label: "S1 Closer", id: "s1c" },
    { label: "S2 Opener", id: "s2o" },
    { label: "S2 Closer", id: "s2c" },
    { label: "Encore", id: "enc" },
    { label: "Wildcard", id: "wild" },
  ];

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
          </div>
          <button onClick={() => signOut(auth)} className="w-full py-4 bg-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest text-red-400 border border-red-900/20">Sign Out</button>
        </div>
      </div>

      {/* TOP NAV */}
      <header className="px-6 py-8 flex justify-between items-center max-w-4xl mx-auto">
        <div><h1 className="text-2xl font-black italic tracking-tighter text-blue-400 flex items-center gap-2"><span className="text-blue-500">⭕</span> PHISH POOL</h1></div>
        <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 flex flex-col justify-center items-center gap-1 bg-slate-800 rounded-xl border border-slate-700">
          <div className="w-5 h-0.5 bg-white"></div><div className="w-5 h-0.5 bg-white"></div><div className="w-3 h-0.5 bg-white self-start ml-2.5"></div>
        </button>
      </header>

      {/* NOTE: Massive bottom padding (pb-64) keeps the floating nav from blocking laptop inputs */}
      <main className="max-w-xl mx-auto px-6 pb-64">
        
        {/* DATE PICKER & POOL SELECTOR */}
        <section className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-[2.5rem] mb-8">
          <div className="grid grid-cols-2 gap-6 items-end">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 mb-2 block tracking-widest">Select Concert Date</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-colors" />
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

        {/* 1. MY PICKS TAB */}
        {activeTab === "picks" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black italic">MY PICKS</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase">1pt Spot / 0.5pt Anywhere</p>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-700 space-y-5">
              {formFields.map(f => {
                const showDropdown = focusedField === f.id && picks[f.id].length > 0;
                const filteredSongs = PHISH_SONGS.filter(song => song.toLowerCase().includes(picks[f.id].toLowerCase()));
                const exactMatch = filteredSongs.length === 1 && filteredSongs[0].toLowerCase() === picks[f.id].toLowerCase();

                return (
                  <div key={f.id} className="relative">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-1 block">{f.label}</label>
                    <input 
                      placeholder="Start typing a song..." value={picks[f.id]}
                      onChange={(e) => { setPicks({ ...picks, [f.id]: e.target.value }); setHighlightedIndex(-1); }}
                      onFocus={() => { setFocusedField(f.id); setHighlightedIndex(-1); }}
                      onBlur={() => setFocusedField(null)}
                      onKeyDown={(e) => {
                        if (!showDropdown || filteredSongs.length === 0) return;
                        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(prev => (prev < filteredSongs.length - 1 ? prev + 1 : prev)); }
                        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1)); }
                        else if (e.key === 'Enter') { e.preventDefault(); setPicks({ ...picks, [f.id]: filteredSongs[highlightedIndex >= 0 ? highlightedIndex : 0] }); setFocusedField(null); setHighlightedIndex(-1); }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-colors" 
                    />
                    {showDropdown && filteredSongs.length > 0 && !exactMatch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto overflow-hidden">
                        {filteredSongs.map((song, index) => (
                          <div key={song} onMouseDown={(e) => { e.preventDefault(); setPicks({ ...picks, [f.id]: song }); setFocusedField(null); setHighlightedIndex(-1); }} className={`p-4 text-sm font-bold border-b border-slate-700/50 cursor-pointer transition-colors ${highlightedIndex === index ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`}>{song}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <button onClick={handleSavePicks} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 py-5 rounded-3xl font-black tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-transform mt-4">
                {saveStatus || "LOCK IN PICKS"}
              </button>
            </div>
          </div>
        )}

        {/* 2. POOLS TAB (ACCORDION DESIGN) */}
        {activeTab === "pools" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black italic uppercase">GLOBAL POOL PICKS</h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full">{poolPicks.length} PLAYERS</span>
            </div>

            {!actualSetlist && poolPicks.length > 0 && (
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-4 text-center">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Awaiting Show Results...</p>
              </div>
            )}

            {poolPicks.length === 0 ? (
              <div className="bg-slate-800/80 rounded-[2.5rem] border border-slate-700 p-8 text-center">
                <div className="text-4xl mb-4">🤷‍♂️</div>
                <p className="text-slate-400 text-sm font-bold">No picks locked in for {selectedDate} yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {poolPicks.map(p => {
                  const totalScore = getTotalScore(p);
                  const isExpanded = expandedUser === p.id;

                  return (
                    <div key={p.id} className="bg-slate-800/80 rounded-[1.5rem] border border-slate-700 overflow-hidden shadow-lg transition-all">
                      <button 
                        onClick={() => setExpandedUser(isExpanded ? null : p.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-lg shadow-inner">👤</div>
                          <span className="font-black text-white text-base tracking-tight">{p.handle}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="font-black text-emerald-400 text-xl block leading-none">{actualSetlist ? totalScore : '-'}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pts</span>
                          </div>
                          <div className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
                          <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                            {formFields.map(item => {
                              const guessedVal = p[item.id];
                              const pts = getPointValue(item.id, guessedVal);
                              
                              let bgStyle = "bg-slate-900/50 border-slate-700/50";
                              let badge = null;

                              if (pts === 1) {
                                bgStyle = "bg-emerald-900/20 border-emerald-500/30";
                                badge = <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-black">+1</span>;
                              } else if (pts === 0.5) {
                                bgStyle = "bg-blue-900/20 border-blue-500/30";
                                badge = <span className="bg-blue-500/20 text-blue-400 text-[9px] px-1.5 py-0.5 rounded font-black">+0.5</span>;
                              } else if (actualSetlist && pts === 0) {
                                bgStyle = "bg-red-900/10 border-red-500/20 opacity-60";
                                badge = <span className="text-red-500/50 text-[9px] px-1.5 py-0.5 rounded font-black">X</span>;
                              }

                              return (
                                <div key={item.id} className={`${bgStyle} p-3 rounded-xl border flex flex-col justify-center transition-colors`}>
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-[9px] text-slate-500 uppercase block">{item.label}</span>
                                    {badge}
                                  </div>
                                  <span className="text-blue-100 truncate">{guessedVal || "—"}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. ADMIN TAB (MASTER SETLIST / API SCAFFOLDING) */}
        {activeTab === "admin" && user.email === ADMIN_EMAIL && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black italic text-emerald-400">👑 MASTER SETLIST</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Publish Actual Results</p>
            </div>
            
            <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-emerald-500/30 space-y-5">
              
              <button onClick={handleFetchFromPhishNet} className="w-full bg-slate-900 border border-blue-500/50 text-blue-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2">
                📡 {saveStatus.includes("API") ? saveStatus : "Auto-Fetch from Phish.net"}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">Or Enter Manually</span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>

              {formFields.map(f => {
                const showDropdown = focusedField === `admin_${f.id}` && adminResults[f.id].length > 0;
                const filteredSongs = PHISH_SONGS.filter(song => song.toLowerCase().includes(adminResults[f.id].toLowerCase()));
                const exactMatch = filteredSongs.length === 1 && filteredSongs[0].toLowerCase() === adminResults[f.id].toLowerCase();

                return (
                  <div key={`admin_${f.id}`} className="relative">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-1 block">{f.label}</label>
                    <input 
                      placeholder="Actual song played..." value={adminResults[f.id]}
                      onChange={(e) => { setAdminResults({ ...adminResults, [f.id]: e.target.value }); setHighlightedIndex(-1); }}
                      onFocus={() => { setFocusedField(`admin_${f.id}`); setHighlightedIndex(-1); }}
                      onBlur={() => setFocusedField(null)}
                      onKeyDown={(e) => {
                        if (!showDropdown || filteredSongs.length === 0) return;
                        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(prev => (prev < filteredSongs.length - 1 ? prev + 1 : prev)); }
                        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1)); }
                        else if (e.key === 'Enter') { e.preventDefault(); setAdminResults({ ...adminResults, [f.id]: filteredSongs[highlightedIndex >= 0 ? highlightedIndex : 0] }); setFocusedField(null); setHighlightedIndex(-1); }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-colors" 
                    />
                    {showDropdown && filteredSongs.length > 0 && !exactMatch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto overflow-hidden">
                        {filteredSongs.map((song, index) => (
                          <div key={song} onMouseDown={(e) => { e.preventDefault(); setAdminResults({ ...adminResults, [f.id]: song }); setFocusedField(null); setHighlightedIndex(-1); }} className={`p-4 text-sm font-bold border-b border-slate-700/50 cursor-pointer transition-colors ${highlightedIndex === index ? 'bg-emerald-600 text-white' : 'hover:bg-slate-700'}`}>{song}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <button onClick={handleSaveResults} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 py-5 rounded-3xl font-black tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-transform mt-4 text-black">
                {saveStatus.includes("Publishing") || saveStatus.includes("Published") ? saveStatus : "PUBLISH RESULTS"}
              </button>
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex gap-1 shadow-2xl z-40">
        {[
          { id: "picks", label: "Picks", icon: "🎟️" },
          { id: "pools", label: "Pools", icon: "🤝" },
          ...(user.email === ADMIN_EMAIL ? [{ id: "admin", label: "Admin", icon: "👑" }] : [])
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-6 py-3 rounded-full flex items-center gap-2 transition-all ${activeTab === t.id ? "bg-white text-black font-black" : "text-slate-400 hover:text-white"}`}
          >
            <span className="text-lg">{t.icon}</span>
            <span className="text-[10px] uppercase font-bold tracking-tighter">{t.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}
