import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc,
  setDoc, 
  onSnapshot, 
  collection, 
  query 
} from "firebase/firestore";

// ==========================================
// 1. FIREBASE SETUP
// ==========================================
// PASTE YOUR FIREBASE CONFIG HERE
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

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [handleInput, setHandleInput] = useState("");
  
  // Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // App State
  const [picks, setPicks] = useState({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });
  const [leaderboard, setLeaderboard] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    const q = query(collection(db, "picks"));
    const unsubscribePicks = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboard(data.sort((a, b) => (b.points || 0) - (a.points || 0)));
    });

    return () => { unsubscribeAuth(); unsubscribePicks(); };
  }, []);

  const handleGoogleLogin = () => signInWithPopup(auth, googleProvider);
  
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { setMessage(err.message); }
  };

  const saveHandle = async () => {
    if (!handleInput) return;
    const profile = { handle: handleInput, email: user.email, totalPoints: 0 };
    await setDoc(doc(db, "users", user.uid), profile);
    setUserProfile(profile);
  };

  const savePicks = async () => {
    if (!userProfile?.handle) return;
    try {
      await setDoc(doc(db, "picks", user.uid), {
        handle: userProfile.handle,
        picks,
        points: 0,
        timestamp: new Date().toISOString()
      });
      setMessage("✅ Picks Locked In!");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) { setMessage("❌ Error saving picks."); }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

  // --- 1. LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col justify-center items-center">
        <h1 className="text-4xl font-black italic text-blue-400 mb-8">⭕ PHISH POOL</h1>
        <div className="w-full max-w-sm bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input type="email" placeholder="Email" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl" onChange={e => setPassword(e.target.value)} />
            <button className="w-full bg-blue-600 font-bold py-3 rounded-xl">{isRegistering ? "Create Account" : "Sign In"}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-xs text-slate-400 underline">
            {isRegistering ? "Already have an account? Sign In" : "Need an account? Register"}
          </button>
          <div className="relative py-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-800 px-2 text-slate-500">Or</span></div></div>
          <button onClick={handleGoogleLogin} className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" /> Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // --- 2. PROFILE SETUP (HANDLE) ---
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col justify-center items-center">
        <div className="w-full max-w-sm bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          <h2 className="text-xl font-bold text-blue-400">Choose your Handle</h2>
          <p className="text-sm text-slate-400">This username will appear on the leaderboard.</p>
          <input 
            type="text" 
            placeholder="Username" 
            className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl" 
            value={handleInput}
            onChange={e => setHandleInput(e.target.value)}
          />
          <button onClick={saveHandle} className="w-full bg-blue-600 font-bold py-3 rounded-xl text-white">Save & Continue</button>
        </div>
      </div>
    );
  }

  // --- 3. MAIN APP ---
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-md mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black italic text-blue-400">⭕ PHISH POOL</h1>
          <p className="text-xs text-slate-500">Logged in as {userProfile.handle}</p>
        </div>
        <button onClick={() => signOut(auth)} className="text-[10px] bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-400 uppercase font-bold">Sign Out</button>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-4">
          <h2 className="font-bold text-blue-400 border-b border-slate-700 pb-2">Tonight's Picks</h2>
          {[
            { label: "Set 1 Opener", id: "s1o" }, { label: "Set 1 Closer", id: "s1c" },
            { label: "Set 2 Opener", id: "s2o" }, { label: "Set 2 Closer", id: "s2c" },
            { label: "Encore", id: "enc" }, { label: "Wildcard", id: "wild" },
          ].map((field) => (
            <div key={field.id}>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{field.label}</label>
              <select className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm" value={picks[field.id]} onChange={(e) => setPicks({...picks, [field.id]: e.target.value})}>
                <option value="">Select a song...</option>
                {PHISH_SONGS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
          <button onClick={savePicks} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg">LOCK IN PICKS</button>
          {message && <p className="text-center text-sm font-bold text-blue-400">{message}</p>}
        </div>

        <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-700/50 p-4 font-bold text-xs uppercase text-slate-400">Leaderboard</div>
          <div className="divide-y divide-slate-700">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-slate-500 italic text-sm">No picks yet.</div>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={entry.id} className="flex justify-between p-4 items-center">
                  <span className="text-sm font-bold"><span className="text-blue-500 mr-2">#{i+1}</span> {entry.handle}</span>
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
