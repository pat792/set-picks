import Header from './src/components/layout/Header';
import PicksForm from './src/components/picks/PicksForm';
import Leaderboard from './src/components/pools/Leaderboard';
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, onSnapshot } from "firebase/firestore";

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
  const [adminResults, setAdminResults] = useState({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });

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
        } else { setUser(null); setUserProfile(null); }
      } catch (err) { console.error("Auth error:", err); } 
      finally { setLoading(false); }
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

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-black italic text-2xl">LOADING...</div>;

  if (!user) return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 scale-150">⭕</div>
      <h1 className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">PHISH POOL</h1>
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-white text-black px-10 py-4 rounded-full font-black mt-8 shadow-xl">
        SIGN IN WITH GOOGLE
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans">
      <Header 
        selectedDate={selectedDate} 
        setSelectedDate={setSelectedDate} 
        onOpenMenu={() => setIsMenuOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={user.email === ADMIN_EMAIL}
      />
      
      <main className="max-w-xl mx-auto px-6 pb-24 pt-8">
        {activeTab === "picks" && <PicksForm picks={picks} setPicks={setPicks} formFields={formFields} PHISH_SONGS={PHISH_SONGS} handleSavePicks={handleSavePicks} saveStatus={saveStatus} />}
        {activeTab === "pools" && <Leaderboard poolPicks={poolPicks} actualSetlist={actualSetlist} getTotalScore={getTotalScore} formFields={formFields} />}
        {activeTab === "admin" && user.email === ADMIN_EMAIL && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 p-6 rounded-[2.5rem] border border-emerald-500/30 space-y-5 shadow-xl">
              <h3 className="text-center font-black text-emerald-400 uppercase tracking-widest text-sm">Master Setlist</h3>
              {formFields.map(f => (
                <div key={`admin_${f.id}`}>
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-1 block">{f.label}</label>
                  <input value={adminResults[f.id]} onChange={(e) => setAdminResults({ ...adminResults, [f.id]: e.target.value })} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors [color-scheme:dark]" />
                </div>
              ))}
              <button onClick={handleSaveResults} className="w-full bg-emerald-600 py-5 rounded-3xl font-black text-black mt-4">PUBLISH RESULTS</button>
            </div>
          </div>
        )}
      </main>
      
      {/* SIDEBAR */}
      <div className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setIsMenuOpen(false)}>
        <div className={`absolute right-0 top-0 h-full w-80 bg-slate-800 p-8 flex flex-col transform transition-transform duration-300 shadow-2xl ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setIsMenuOpen(false)} className="self-end text-slate-400 text-2xl">✕</button>
          <div className="mt-8 text-center flex-grow">
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full mx-auto flex items-center justify-center text-4xl mb-6 shadow-xl">👤</div>
            <h2 className="text-2xl font-black text-white">{userProfile?.handle || "Phan"}</h2>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-2">{userProfile?.email}</p>
          </div>
          <button onClick={() => signOut(auth)} className="w-full py-5 bg-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest text-red-400 border border-red-900/20">Sign Out</button>
        </div>
      </div>
    </div>
  );
}
