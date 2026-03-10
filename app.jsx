import Header from './src/components/layout/Header';
import PicksForm from './src/components/picks/PicksForm';
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
  const [poolPicks, setPoolPicks] = useState([]);
  const [actualSetlist, setActualSetlist] = useState(null);

  const [picks, setPicks] = useState({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });

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

            if (!userData.joinedPools || !userData.joinedPools.includes(GLOBAL_POOL_ID)) {
              await updateDoc(userRef, { joinedPools: arrayUnion(GLOBAL_POOL_ID) });
              await updateDoc(doc(db, "pools", GLOBAL_POOL_ID), { members: arrayUnion(u.uid) });
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

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "picks"), where("date", "==", selectedDate));
    const unsubscribePicks = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() }));
      setPoolPicks(fetched);
    });

    const unsubscribeResults = onSnapshot(doc(db, "results", selectedDate), (docSnap) => {
      if (docSnap.exists()) setActualSetlist(docSnap.data());
      else setActualSetlist(null);
    });

    return () => { unsubscribePicks(); unsubscribeResults(); };
  }, [selectedDate]);

  const saveHandle = async (handle) => {
    if (!handle.trim()) return;
    const profile = { handle, email: user.email, stats: { totalPoints: 0, showsPlayed: 0 }, joinedPools: [GLOBAL_POOL_ID] };
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

  const getTotalScore = (uPicks) => {
    if (!actualSetlist) return null;
    let total = 0;
    ['s1o', 's1c', 's2o', 's2c', 'enc', 'wild'].forEach(f => {
      if (actualSetlist[f]?.toLowerCase() === uPicks[f]?.toLowerCase()) total += 1;
      else if (Object.values(actualSetlist).some(s => s?.toLowerCase() === uPicks[f]?.toLowerCase())) total += 0.5;
    });
    return total;
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black italic tracking-widest">LOADING...</div>;

  if (!user) return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 scale-150">⭕</div>
      <h1 className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">PHISH POOL</h1>
      <button 
        onClick={async () => {
          try { await signInWithPopup(auth, googleProvider); } 
          catch (e) { alert(`Login Error: ${e.code}`); }
        }} 
        className="bg-white text-black px-10 py-4 rounded-full font-black flex items-center gap-3 shadow-xl"
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
      <Header selectedDate={selectedDate} setSelectedDate={setSelectedDate} activePoolName="Global Pool" />
      
      <main className="max-w-xl mx-auto px-6 pb-64 pt-8">
        <div className="flex bg-slate-900/50 p-1 rounded-2xl mb-8 border border-slate-700">
          <button onClick={() => setActiveTab("picks")} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${activeTab === 'picks' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Picks</button>
          <button onClick={() => setActiveTab("pools")} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${activeTab === 'pools' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Leaderboard</button>
        </div>

        {activeTab === "picks" && (
          <PicksForm 
            picks={picks} 
            setPicks={setPicks} 
            formFields={formFields} 
            PHISH_SONGS={PHISH_SONGS} 
            handleSavePicks={handleSavePicks} 
            saveStatus={saveStatus} 
          />
        )}

        {activeTab === "pools" && (
          <div className="space-y-4">
            {poolPicks.map(p => (
              <div key={p.id} className="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full flex items-center justify-center font-bold">👤</div>
                  <span className="font-black text-white">{p.handle}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-400 text-xl block leading-none">{actualSetlist ? getTotalScore(p) : '-'}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Points</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <button onClick={() => setIsMenuOpen(true)} className="fixed top-6 right-6 z-40 bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-xl">☰</button>
      
      <div className={`fixed inset-y-0 right-0 w-80 bg-slate-800 shadow-2xl z-50 transform transition-transform duration-300 border-l border-slate-700 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-8 h-full flex flex-col">
          <button onClick={() => setIsMenuOpen(false)} className="self-end text-slate-400 text-2xl font-light">✕</button>
          <div className="mt-8 text-center flex-grow">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full mx-auto flex items-center justify-center text-3xl mb-4">👤</div>
            <h2 className="text-2xl font-black">{userProfile?.handle || "Phan"}</h2>
          </div>
          <button onClick={() => signOut(auth)} className="w-full py-4 bg-slate-900 rounded-2xl text-xs font-black uppercase text-red-400 border border-red-900/20">Sign Out</button>
        </div>
      </div>
    </div>
  );
}
