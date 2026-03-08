import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  where 
} from "firebase/firestore";

// ==========================================
// 1. FIREBASE SETUP
// ==========================================
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

// ==========================================
// 2. SONG DATABASE
// ==========================================
const PHISH_SONGS = [
  "2001", "46 Days", "AC/DC Bag", "Antelope", "Bathtub Gin", "Blaze On", "Cavern", 
  "Carini", "Character Zero", "Chalk Dust Torture", "Divided Sky", "Down with Disease", 
  "Everything's Right", "Fluffhead", "Free", "Ghost", "Gotta Jibboo", "Guyute", 
  "Harry Hood", "I Am Hydrogen", "Llama", "Maze", "Mike's Song", "No Men In No Man's Land", 
  "Piper", "Possum", "Prince Caspian", "Reba", "Runaway Jim", "Sand", "Say It To Me S.A.N.T.O.S.", 
  "Slave to the Traffic Light", "Stash", "The Moma Dance", "Tweezer", "Tweezer Reprise", 
  "Twist", "Weekapaug Groove", "Wolfman's Brother", "You Enjoy Myself"
].sort();

// ==========================================
// 3. THE APP
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [picks, setPicks] = useState({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });
  const [leaderboard, setLeaderboard] = useState([]);
  const [message, setMessage] = useState("");

  // Login & Real-time Listeners
  useEffect(() => {
    signInAnonymously(auth);
    onAuthStateChanged(auth, (u) => { if (u) setUser(u); });

    // Listen to all picks for leaderboard
    const q = query(collection(db, "picks"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboard(data.sort((a, b) => (b.points || 0) - (a.points || 0)));
    });
    return () => unsubscribe();
  }, []);

  const savePicks = async () => {
    if (!displayName) return setMessage("❌ Enter a name first!");
    try {
      await setDoc(doc(db, "picks", user.uid), {
        displayName,
        picks,
        points: 0, // Admin updates this later
        timestamp: new Date().toISOString()
      });
      setMessage("✅ Picks Locked In!");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage("❌ Error saving. Check Firebase rules.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-4">
      {/* HEADER */}
      <div className="max-w-md mx-auto text-center mb-8">
        <h1 className="text-4xl font-black italic tracking-tighter text-blue-400">⭕ PHISH POOL</h1>
        <p className="text-slate-400 text-sm">Nail the setlist. Win the game.</p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* PROFILE */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Your Handle</label>
          <input 
            type="text" 
            className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. HoodKid420"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        {/* PICK SLIP */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-4">
          <h2 className="font-bold text-blue-400 border-b border-slate-700 pb-2">Tonight's Picks</h2>
          
          {[
            { label: "Set 1 Opener", id: "s1o" },
            { label: "Set 1 Closer", id: "s1c" },
            { label: "Set 2 Opener", id: "s2o" },
            { label: "Set 2 Closer", id: "s2c" },
            { label: "Encore", id: "enc" },
            { label: "Wildcard (Any set)", id: "wild" },
          ].map((field) => (
            <div key={field.id}>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{field.label}</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm"
                value={picks[field.id]}
                onChange={(e) => setPicks({...picks, [field.id]: e.target.value})}
              >
                <option value="">Select a song...</option>
                {PHISH_SONGS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}

          <button 
            onClick={savePicks}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all transform active:scale-95 shadow-lg shadow-blue-900/20"
          >
            LOCK IN PICKS
          </button>
          {message && <p className="text-center text-sm font-bold animate-bounce">{message}</p>}
        </div>

        {/* LEADERBOARD */}
        <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-700/50 p-4 font-bold text-xs uppercase tracking-widest text-slate-400">Leaderboard</div>
          <div className="divide-y divide-slate-700">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-slate-500 italic text-sm">No picks in yet. Be the first!</div>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={entry.id} className="flex justify-between p-4 items-center">
                  <span className="text-sm font-bold"><span className="text-blue-500 mr-2">#{i+1}</span> {entry.displayName}</span>
                  <span className="bg-blue-900/50 text-blue-400 px-3 py-1 rounded-full text-xs font-black">{entry.points || 0} PTS</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
