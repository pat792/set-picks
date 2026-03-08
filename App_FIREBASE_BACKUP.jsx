import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection } from 'firebase/firestore';

// --- PHISH SONG DATABASE (Mocked for Predictive Text) ---
const PHISH_SONGS = [
  "46 Days", "AC/DC Bag", "Also Sprach Zarathustra (2001)", "Alumni Blues", "Axilla", "Back on the Train", 
  "Bathtub Gin", "Birds of a Feather", "Blaze On", "Boogie On Reggae Woman", "Bouncing Around the Room", 
  "Bug", "Buried Alive", "Camel Walk", "Carini", "Cavern", "Chalk Dust Torture", "Character Zero", 
  "Cities", "Crosseyed and Painless", "David Bowie", "Destiny Unbound", "Divided Sky", "Down with Disease", 
  "Drift While You're Sleeping", "Everything's Right", "Farmhouse", "Fee", "First Tube", "Fluffhead", 
  "Free", "Fuego", "Ghost", "Golden Age", "Golgi Apparatus", "Good Times Bad Times", "Gotta Jibboo", 
  "Gumbo", "Guyute", "Halley's Comet", "Harry Hood", "Horn", "I Am Hydrogen", "Icculus", "It's Ice", 
  "Julius", "Kill Devil Falls", "Lawn Boy", "Light", "Limb By Limb", "Loving Cup", "Makupa Policeman", 
  "Maze", "Meatstick", "Mike's Song", "Moma Dance", "Moonage Daydream", "More", "My Friend, My Friend", 
  "My Soul", "No Men In No Man's Land", "Ocelot", "Party Time", "Pebbles and Marbles", "Piper", "Possum", 
  "Prince Caspian", "Punch You in the Eye", "Reba", "Rift", "Rock and Roll", "Roggae", "Roses Are Free", 
  "Run Like an Antelope", "Runaway Jim", "Sample in a Jar", "Sand", "Sanity", "Say It To Me S.A.N.T.O.S.", 
  "Scents and Subtle Sounds", "Set Your Soul Free", "Sigma Oasis", "Simple", "Slave to the Traffic Light", 
  "Sleeping Monkey", "Sparkle", "Split Open and Melt", "Squirming Coil", "Stash", "Steam", "Suzy Greenberg", 
  "The Curtain With", "The Howling", "The Lizards", "The Moma Dance", "The Wedge", "Theme From the Bottom", 
  "Tube", "Tweezer", "Tweezer Reprise", "Twist", "Vultures", "Waiting All Night", "Walk Away", 
  "Walls of the Cave", "Waste", "Water in the Sky", "Waves", "Weekapaug Groove", "What's the Use?", 
  "Wilson", "Wolfman's Brother", "Wombat", "Ya Mar", "You Enjoy Myself"
].sort();

// --- FIREBASE INIT ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- PREDICTIVE TEXT INPUT COMPONENT ---
const AutocompleteInput = ({ label, value, onChange, placeholder }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value && showSuggestions) {
      const filtered = PHISH_SONGS.filter(song => 
        song.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8); // Show top 8 matches
      setFilteredSongs(filtered);
    } else {
      setFilteredSongs([]);
    }
  }, [value, showSuggestions]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col gap-1" ref={wrapperRef}>
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
      />
      {showSuggestions && filteredSongs.length > 0 && (
        <ul className="absolute z-10 w-full top-[100%] left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filteredSongs.map((song, index) => (
            <li 
              key={index}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents input from losing focus immediately
                onChange(song);
                setShowSuggestions(false);
              }}
              className="p-3 hover:bg-blue-50 cursor-pointer text-slate-700 border-b border-slate-100 last:border-b-0"
            >
              {song}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ displayName: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState("picks"); // 'picks', 'leaderboard', 'admin'

  // Form State
  const [picks, setPicks] = useState({
    s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  // Pool State
  const [poolEntries, setPoolEntries] = useState([]);
  const [liveSetlist, setLiveSetlist] = useState({ s1: [], s2: [], enc: [] });

  // Admin Input State (comma separated)
  const [adminInput, setAdminInput] = useState({ s1: "", s2: "", enc: "" });

  // 1. Init Auth
  useEffect(() => {
    if (!auth) {
      setError("Firebase not configured.");
      setLoading(false);
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        setError("Failed to authenticate.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    if (!user || !db) return;
    
    // Fetch Live Setlist
    const liveSetlistRef = doc(db, 'artifacts', appId, 'public', 'data', 'live_setlist', 'current');
    
    // Listeners
    const unsubPicks = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'pool_entries'), (snap) => {
      const entries = [];
      snap.forEach(d => {
        entries.push({ id: d.id, ...d.data() });
        if (d.id === user.uid) {
          setPicks(d.data().picks || { s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });
          setProfile({ displayName: d.data().displayName || "" });
        }
      });
      setPoolEntries(entries);
    }, (err) => setError(err?.message || "Failed to load pool entries"));

    const unsubSetlist = onSnapshot(liveSetlistRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLiveSetlist(data);
        setAdminInput({
          s1: (data.s1 || []).join(", "),
          s2: (data.s2 || []).join(", "),
          enc: (data.enc || []).join(", ")
        });
      }
    }, (err) => setError(err?.message || "Failed to load active setlist"));

    return () => { unsubPicks(); unsubSetlist(); };
  }, [user]);

  // --- Handlers ---
  const handleSavePicks = async () => {
    setError(null);
    setSuccessMsg("");

    if (!profile.displayName.trim()) {
      setError("Please enter a Display Name before locking in your picks!");
      return;
    }

    setIsSaving(true);
    try {
      const myPicksRef = doc(db, 'artifacts', appId, 'public', 'data', 'pool_entries', user.uid);
      await setDoc(myPicksRef, {
        displayName: profile.displayName,
        picks: picks,
        updatedAt: new Date().toISOString()
      });
      setSuccessMsg("Picks saved successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err?.message || "An error occurred while saving picks.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateLiveSetlist = async () => {
    setError(null);
    setSuccessMsg("");

    try {
      const cleanArray = (str) => str.split(',').map(s => s.trim()).filter(s => s);
      const data = {
        s1: cleanArray(adminInput.s1),
        s2: cleanArray(adminInput.s2),
        enc: cleanArray(adminInput.enc)
      };
      const liveSetlistRef = doc(db, 'artifacts', appId, 'public', 'data', 'live_setlist', 'current');
      await setDoc(liveSetlistRef, data);
      
      setSuccessMsg("Live setlist updated! Leaderboard recalculated.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err?.message || "An error occurred while updating the setlist.");
    }
  };

  // --- Scoring Logic ---
  const calculateScore = (userPicks) => {
    let total = 0;
    const scores = { s1o: 0, s1c: 0, s2o: 0, s2c: 0, enc: 0, wild: 0 };
    
    // Normalize setlist for easy matching
    const norm = (s) => (s || "").toLowerCase().trim();
    const allSongs = [...(liveSetlist.s1 || []), ...(liveSetlist.s2 || []), ...(liveSetlist.enc || [])].map(norm);
    const s1 = (liveSetlist.s1 || []).map(norm);
    const s2 = (liveSetlist.s2 || []).map(norm);
    const enc = (liveSetlist.enc || []).map(norm);

    if (allSongs.length === 0) return { total: 0, scores }; // No show yet

    const scorePick = (pick, exactMatchFn) => {
      if (!pick) return 0;
      const p = norm(pick);
      if (exactMatchFn(p)) return 1;
      if (allSongs.includes(p)) return 0.5;
      return 0;
    };

    // Calculate each
    scores.s1o = scorePick(userPicks.s1o, p => s1.length > 0 && p === s1[0]);
    scores.s1c = scorePick(userPicks.s1c, p => s1.length > 0 && p === s1[s1.length - 1]);
    scores.s2o = scorePick(userPicks.s2o, p => s2.length > 0 && p === s2[0]);
    scores.s2c = scorePick(userPicks.s2c, p => s2.length > 0 && p === s2[s2.length - 1]);
    scores.enc = scorePick(userPicks.enc, p => enc.length > 0 && enc.includes(p)); // Any in encore = 1pt
    scores.wild = userPicks.wild && allSongs.includes(norm(userPicks.wild)) ? 1 : 0;

    total = scores.s1o + scores.s1c + scores.s2o + scores.s2c + scores.enc + scores.wild;
    
    return { total, scores };
  };

  // Prepare leaderboard data
  const leaderboardData = poolEntries.map(entry => {
    const { total, scores } = calculateScore(entry.picks || {});
    return { ...entry, total, scores };
  }).sort((a, b) => b.total - a.total); // Sort highest to lowest

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-100">Loading Pool...</div>;

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-12">
      {/* Header */}
      <div className="bg-blue-800 text-white p-6 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              ⭕ Phish Pool
            </h1>
            <p className="text-blue-200 mt-1">Predict the jams. Win the glory.</p>
          </div>
          
          <div className="flex bg-blue-900/50 rounded-lg p-1">
            <button 
              onClick={() => setActiveTab("picks")}
              className={`px-4 py-2 rounded-md font-bold transition-all ${activeTab === "picks" ? "bg-white text-blue-900 shadow" : "text-blue-100 hover:text-white"}`}
            >
              My Picks
            </button>
            <button 
              onClick={() => setActiveTab("leaderboard")}
              className={`px-4 py-2 rounded-md font-bold transition-all ${activeTab === "leaderboard" ? "bg-white text-blue-900 shadow" : "text-blue-100 hover:text-white"}`}
            >
              Leaderboard
            </button>
            <button 
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 rounded-md font-bold transition-all ${activeTab === "admin" ? "bg-white text-blue-900 shadow" : "text-blue-100 hover:text-white"}`}
            >
              Live Setlist
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 px-4">
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 shadow-sm border border-red-200">{error}</div>}
        {successMsg && <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 shadow-sm border border-green-200">{successMsg}</div>}

        {/* --- MY PICKS TAB --- */}
        {activeTab === "picks" && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-w-2xl mx-auto">
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-1">Your Display Name</label>
              <input 
                type="text" 
                value={profile.displayName}
                onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                placeholder="e.g., Couch Boy"
                className="w-full max-w-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AutocompleteInput 
                  label="Set 1 Opener" 
                  value={picks.s1o} 
                  onChange={(v) => setPicks({...picks, s1o: v})}
                  placeholder="e.g. Buried Alive"
                />
                <AutocompleteInput 
                  label="Set 1 Closer" 
                  value={picks.s1c} 
                  onChange={(v) => setPicks({...picks, s1c: v})}
                  placeholder="e.g. Antelope"
                />
                <AutocompleteInput 
                  label="Set 2 Opener" 
                  value={picks.s2o} 
                  onChange={(v) => setPicks({...picks, s2o: v})}
                  placeholder="e.g. Down with Disease"
                />
                <AutocompleteInput 
                  label="Set 2 Closer" 
                  value={picks.s2c} 
                  onChange={(v) => setPicks({...picks, s2c: v})}
                  placeholder="e.g. Character Zero"
                />
                <AutocompleteInput 
                  label="Encore" 
                  value={picks.enc} 
                  onChange={(v) => setPicks({...picks, enc: v})}
                  placeholder="e.g. First Tube"
                />
                <AutocompleteInput 
                  label="Wildcard" 
                  value={picks.wild} 
                  onChange={(v) => setPicks({...picks, wild: v})}
                  placeholder="Any song played"
                />
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button 
                  onClick={handleSavePicks}
                  disabled={isSaving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 text-lg"
                >
                  {isSaving ? "Saving..." : "Lock In Picks"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- LEADERBOARD TAB --- */}
        {activeTab === "leaderboard" && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">Pool Leaderboard</h2>
              <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                1 pt = Exact Spot/Wildcard | 0.5 pts = Picked anywhere
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                  <tr>
                    <th className="p-4 border-b">Player</th>
                    <th className="p-4 border-b bg-blue-50/50">S1 Opener</th>
                    <th className="p-4 border-b text-center bg-blue-50/50">Pts</th>
                    <th className="p-4 border-b">S1 Closer</th>
                    <th className="p-4 border-b text-center">Pts</th>
                    <th className="p-4 border-b bg-blue-50/50">S2 Opener</th>
                    <th className="p-4 border-b text-center bg-blue-50/50">Pts</th>
                    <th className="p-4 border-b">S2 Closer</th>
                    <th className="p-4 border-b text-center">Pts</th>
                    <th className="p-4 border-b bg-blue-50/50">Encore</th>
                    <th className="p-4 border-b text-center bg-blue-50/50">Pts</th>
                    <th className="p-4 border-b">Wildcard</th>
                    <th className="p-4 border-b text-center">Pts</th>
                    <th className="p-4 border-b bg-green-100 text-green-800 text-center font-black">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboardData.length === 0 ? (
                    <tr>
                      <td colSpan="14" className="p-8 text-center text-slate-500 italic">No players have locked in picks yet.</td>
                    </tr>
                  ) : (
                    leaderboardData.map((entry, idx) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800 border-r">{entry.displayName || "Unknown"}</td>
                        
                        <td className="p-4 bg-blue-50/30">{entry.picks?.s1o || "-"}</td>
                        <td className={`p-4 text-center font-mono font-bold bg-blue-50/30 ${entry.scores.s1o > 0 ? 'text-green-600' : 'text-slate-400'}`}>{entry.scores.s1o}</td>
                        
                        <td className="p-4">{entry.picks?.s1c || "-"}</td>
                        <td className={`p-4 text-center font-mono font-bold ${entry.scores.s1c > 0 ? 'text-green-600' : 'text-slate-400'}`}>{entry.scores.s1c}</td>
                        
                        <td className="p-4 bg-blue-50/30">{entry.picks?.s2o || "-"}</td>
                        <td className={`p-4 text-center font-mono font-bold bg-blue-50/30 ${entry.scores.s2o > 0 ? 'text-green-600' : 'text-slate-400'}`}>{entry.scores.s2o}</td>
                        
                        <td className="p-4">{entry.picks?.s2c || "-"}</td>
                        <td className={`p-4 text-center font-mono font-bold ${entry.scores.s2c > 0 ? 'text-green-600' : 'text-slate-400'}`}>{entry.scores.s2c}</td>
                        
                        <td className="p-4 bg-blue-50/30">{entry.picks?.enc || "-"}</td>
                        <td className={`p-4 text-center font-mono font-bold bg-blue-50/30 ${entry.scores.enc > 0 ? 'text-green-600' : 'text-slate-400'}`}>{entry.scores.enc}</td>
                        
                        <td className="p-4">{entry.picks?.wild || "-"}</td>
                        <td className={`p-4 text-center font-mono font-bold ${entry.scores.wild > 0 ? 'text-green-600' : 'text-slate-400'}`}>{entry.scores.wild}</td>
                        
                        <td className="p-4 text-center bg-green-50 font-black text-green-700 text-lg border-l">{entry.total}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- LIVE SETLIST ADMIN TAB --- */}
        {activeTab === "admin" && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-w-2xl mx-auto">
            <div className="p-6 bg-red-50 border-b border-red-200">
              <h2 className="text-xl font-black text-red-800">Mock Live Show Control</h2>
              <p className="text-red-600 text-sm mt-1">Enter the songs actually played tonight to calculate everyone's scores. Separate songs with commas.</p>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Set 1</label>
                <textarea 
                  value={adminInput.s1}
                  onChange={(e) => setAdminInput({...adminInput, s1: e.target.value})}
                  placeholder="Buried Alive, Moma Dance, Free, ..."
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Set 2</label>
                <textarea 
                  value={adminInput.s2}
                  onChange={(e) => setAdminInput({...adminInput, s2: e.target.value})}
                  placeholder="Down with Disease, Ghost, ..."
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Encore</label>
                <input 
                  type="text" 
                  value={adminInput.enc}
                  onChange={(e) => setAdminInput({...adminInput, enc: e.target.value})}
                  placeholder="First Tube"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={handleUpdateLiveSetlist}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98]"
                >
                  Update Live Setlist & Calculate Scores
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
