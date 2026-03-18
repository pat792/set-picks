import React, { useState, useRef } from 'react';
import { doc, setDoc } from "firebase/firestore";
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/useAuth'; // We pull auth directly into the form now!

// 1. We define the form fields directly here so they can never go missing
const FORM_FIELDS = [
  { id: "s1o", label: "Set 1 Opener" },
  { id: "s1c", label: "Set 1 Closer" },
  { id: "s2o", label: "Set 2 Opener" },
  { id: "s2c", label: "Set 2 Closer" },
  { id: "enc", label: "Encore" },
  { id: "wild", label: "Wildcard" }
];

// 2. A fallback song list just in case your main list isn't connected yet
const FALLBACK_SONGS = ["You Enjoy Myself", "Tweezer", "Chalk Dust Torture", "Harry Hood", "Fluffhead"];

const PicksForm = ({ selectedDate = "next_show", PHISH_SONGS = FALLBACK_SONGS }) => {
  const { user, userProfile } = useAuth(); // Automatically grabs the user!
  
  const [picks, setPicks] = useState({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });
  const [saveStatus, setSaveStatus] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const blurTimeoutRef = useRef(null);

  const handleFocus = (fieldId) => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setFocusedField(fieldId);
    setHighlightedIndex(-1);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setFocusedField(null);
      setHighlightedIndex(-1);
    }, 200);
  };

  const handleKeyDown = (e, fieldId, filteredSongs) => {
    if (!focusedField || filteredSongs.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredSongs.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      setPicks({ ...picks, [fieldId]: filteredSongs[highlightedIndex] });
      setFocusedField(null);
      setHighlightedIndex(-1);
    }
  };

  const handleSavePicks = async () => {
    if (!user || !userProfile) return;
    
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
    } catch (e) { 
      setSaveStatus("❌ Error."); 
    }
  };

  return (
    <div className="pb-24 text-white">
      <h2 className="text-lg sm:text-xl font-black italic uppercase px-2 mb-2 sm:mb-4">My Picks</h2>
      
      <div className="bg-slate-800/80 backdrop-blur-md p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-700 shadow-2xl">
        
        {/* THE HONEYPOT */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <input type="text" name="fake_email" autoComplete="email" />
          <input type="password" name="fake_password" autoComplete="current-password" />
          <input type="text" name="fake_cc" autoComplete="cc-number" />
        </div>

        <div className="flex flex-col gap-2.5 sm:gap-4">
          {FORM_FIELDS.map(f => {
            const isFocused = focusedField === f.id;
            const currentInput = picks[f.id] || "";
            // Added ? safety checks so .filter never crashes
            const filteredSongs = PHISH_SONGS?.filter(song => 
              song?.toLowerCase().includes(currentInput.toLowerCase())
            ).slice(0, 8) || [];
            
            const showDropdown = isFocused && currentInput.length > 0 && filteredSongs.length > 0;

            return (
              <div key={f.id} className={`relative ${isFocused ? 'z-50' : 'z-10'}`}>
                <label className="text-[10px] sm:text-xs font-black uppercase text-slate-400 ml-2 sm:ml-3 mb-0.5 sm:mb-1 block">
                  {f.label}
                </label>
                
                <input 
                  type="text" 
                  name={`phish-song-query-${f.id}`}
                  inputMode="search"
                  autoComplete="off" 
                  autoCorrect="off"
                  spellCheck="false"
                  autoCapitalize="words"
                  placeholder="Type a song..."
                  value={picks[f.id]}
                  onChange={(e) => {
                    setPicks({ ...picks, [f.id]: e.target.value });
                    setHighlightedIndex(-1);
                  }}
                  onFocus={() => handleFocus(f.id)}
                  onBlur={handleBlur}
                  onKeyDown={(e) => handleKeyDown(e, f.id, filteredSongs)}
                  className="w-full bg-slate-900 border-2 border-slate-700 py-2.5 px-4 rounded-xl text-base font-bold text-white outline-none focus:border-emerald-500 transition-all shadow-md placeholder:text-slate-500"
                />

                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-[100]">
                    {filteredSongs.map((song, index) => (
                      <div 
                        key={song}
                        onMouseDown={() => {
                          setPicks({ ...picks, [f.id]: song });
                          setFocusedField(null);
                          setHighlightedIndex(-1);
                        }}
                        className={`px-4 py-3 text-sm font-bold cursor-pointer border-b border-slate-800 last:border-0 ${
                          highlightedIndex === index ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {song}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 sm:mt-8">
          <button 
            onClick={handleSavePicks}
            className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white py-3 sm:py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/20"
          >
            {saveStatus || "Lock In Picks"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PicksForm;