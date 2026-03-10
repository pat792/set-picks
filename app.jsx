import Header from './src/components/layout/Header';
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, onSnapshot } from "firebase/firestore";

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

const ADMIN_EMAIL = "pat@road2media.com";
const GLOBAL_POOL_ID = "xfD7pgXWSh2yhoI3rcdT";

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

  const [picks, setPicks] = useState({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });
  const [adminResults, setAdminResults] = useState({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });
  const [poolPicks, setPoolPicks] = useState([]);
  const [actualSetlist, setActualSetlist] = useState(null);

  // --- AUTH & STABILIZED PROFILE LOAD ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          setUser(u);
          const userRef = doc(db, "users", u.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserProfile(userData);

            // SILENT GUARD: Auto-joins Global Pool if missing in Firestore
            if (!userData.joinedPools || !userData.joinedPools.includes(GLOBAL_POOL_ID)) {
              await updateDoc(userRef, { 
                joinedPools: arrayUnion(GLOBAL_POOL_ID) 
              });
              await updateDoc(doc(db, "pools", GLOBAL_POOL_ID), { 
                members: arrayUnion(u.uid) 
              });
            }
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- FETCH POOL DATA ---
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "picks"), where("date", "==", selectedDate));
    const unsubscribePicks = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() }));
      setPoolPicks(fetched);
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

    return () => { unsubscribePicks(); unsubscribeResults(); };
  }, [selectedDate]);

  // --- ACTIONS ---
  const saveHandle = async (handle) => {
    if (!handle.trim()) return;
    const profile = { 
      handle, 
      email: user.email, 
      stats: { totalPoints: 0, showsPlayed: 0 }, 
      joinedPools: [GLOBAL_POOL_ID] 
    };
    await setDoc(doc(db, "users", user.uid), profile);
    await updateDoc(doc(db, "pools", GLOBAL_POOL_ID), { members: arrayUnion(user.uid) });
    setUserProfile(profile);
  };

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

  const getPointValue = (fieldId, guessedSong) => {
    if (!actualSetlist || !guessedSong) return null;
    if (actualSetlist[fieldId]?.toLowerCase() === guessedSong.toLowerCase()) return 1;
    const allPlayed = [actualSetlist.s1o, actualSetlist.s1c, actualSetlist.s2o, actualSetlist.s2c, actualSetlist.enc, actualSetlist.wild].map(s => s?.toLowerCase());
    return allPlayed.includes(guessedSong.toLowerCase()) ? 0.5 : 0;
  };

  const getTotalScore = (uPicks) => {
    if (!actualSetlist) return null;
    let total = 0;
    ['s1o', 's1c', 's2o', 's2c', 'enc', 'wild'].forEach(f => {
      const pts = getPointValue(f, uPicks[f]);
      if (pts) total += pts;
    });
    return total;
  };

  // --- VIEWS ---
  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black italic">LOADING...</div>;

  if (!user) return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 scale-150">⭕</div>
      <h1 className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">PHISH POOL</h1>
      <p className="text-slate-500 font-bold tracking-[0.3em] text-[10px] mb-12 uppercase">Predict the Jams. Win the Glory.</p>
      <button 
        onClick={async () => {
          try {
            await signInWithPopup(auth, googleProvider);
          } catch (e) {
            console.error("Popup error:", e);
            alert("Login failed. Check if popups are blocked.");
          }
        }} 
        className="bg-white text-black px-10 py-4 rounded-full font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
      >
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
    { label: "S1 Opener", id: "s1o" }, { label: "S1 Closer", id: "s1c" },
    { label: "S2 Opener", id: "s2o" }, { label: "S2 Closer", id: "s2c" },
    { label: "Encore", id: "enc" }, { label: "Wildcard", id: "wild" },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans">
      
      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-slate-800 shadow-2xl z-50 transform transition-transform duration-300 border-l border-slate-700 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-8 h-full flex flex-col">
          <button onClick={() => setIsMenuOpen(false)} className="self-end text-slate-400 text-2xl font-light">✕</button>
          <div className="mt-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full mx-auto flex items-center justify-center text-3xl shadow-lg">👤</div>
            <h2 className="text-2xl font-black mt-4">{userProfile?.handle || "Phan"}</h2>
          </div>
          <div className="mt-12 space-y-4 flex-grow">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-500">Total Points</span>
              <span className="text-xl font-black text-emerald-400">{userProfile?.stats?.totalPoints || 0}</span>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="w-full py-4 bg-slate-900 rounded-2xl text-xs font-black uppercase text-red-400 border border-red-900/20">Sign Out</button>
        </div>
      </div>

      <Header selectedDate={selectedDate} setSelectedDate={setSelectedDate} activePoolName="Global Pool" />

      <main className="max-w-xl mx-auto px-6 pb-64">
        {/* DATE & POOL SELECTOR */}
        <section className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-[2.5rem] mb-8 mt-8">
          <div className="grid grid-cols-2 gap-6 items-end">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 mb-2 block tracking-widest">Concert Date</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-2xl text-sm font-bold" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 mb-2 block tracking-widest">Join Pool</label>
              <div className="flex gap-2">
                <input placeholder="Code..." className="w-full bg-slate-900 border border-slate-700 p-3 rounded-2xl text-sm font-bold uppercase" />
                <button className="bg-blue-600 px-4 rounded-2xl font-black text-xs">JOIN</button>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT TABS */}
        {activeTab === "picks" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black italic uppercase">My Picks</h2>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-700 space-y-5">
              {formFields.map(f => {
                const showDropdown = focusedField === f.id && picks[f.id].length > 0;
                const filtered = PHISH_SONGS.filter(s => s.toLowerCase().includes(picks[f.id].toLowerCase()));
                return (
                  <div key={f.id} className="relative">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-1 block">{f.label}</label>
                    <input 
                      placeholder="Type a song..." value={picks[f.id]}
                      onChange={(e) => setPicks({ ...picks, [f.id]: e.target.value })}
                      onFocus={() => setFocusedField(f.id)}
                      onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                      className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm font-bold" 
                    />
                    {showDropdown && filtered.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl z-50 max-h-48 overflow-y-auto">
                        {filtered.map(s => (
                          <div key={s} onClick={() => setPicks({ ...picks, [f.id]: s })} className="p-4 text-sm font-bold border-b border-slate-700/50 hover:bg-slate-700 cursor-pointer">{s}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <button onClick={handleSavePicks} className="w-full bg-blue-600 py-5 rounded-3xl font-black tracking-widest mt-4">
                {saveStatus || "LOCK IN PICKS"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "pools" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black italic uppercase">Pool Picks</h2>
            </div>
            {poolPicks.map(p => (
              <div key={p.id} className="bg-slate-800/80 rounded-[1.5rem] border border-slate-700 p-4 mb-3">
                <div className="flex justify-between items-center">
                  <span className="font-black text-white">{p.handle}</span>
                  <span className="font-black text-emerald-400 text-xl">{actualSetlist ? getTotalScore(p) : '-'} Pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex gap-1 z-40">
        {[
          { id: "picks", label: "Picks", icon: "🎟️" },
          { id: "pools", label: "Pools", icon: "🤝" },
          ...(user?.email === ADMIN_EMAIL ? [{ id: "admin", label: "Admin", icon: "👑" }] : [])
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-6 py-3 rounded-full flex items-center gap-2 transition-all ${activeTab === t.id ? "bg-white text-black font-black" : "text-slate-400 hover:text-white"}`}>
            <span className="text-lg">{t.icon}</span>
            <span className="text-[10px] uppercase font-bold">{t.label}</span>
          </button>
        ))}
      </nav>
      <button onClick={() => setIsMenuOpen(true)} className="fixed top-6 right-6 z-40 bg-slate-800 p-3 rounded-xl border border-slate-700">☰</button>
    </div>
  );
}
