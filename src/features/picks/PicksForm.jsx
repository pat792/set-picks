import React, { useState, useRef } from 'react';
import { doc, setDoc } from "firebase/firestore";
import { db } from '../../lib/firebase';

const PicksForm = ({ selectedDate, user, userProfile, formFields, PHISH_SONGS }) => {
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
    // Tightened the main vertical spacing for mobile
    <div className="space-y-1 sm:space-y-4 pb-24 text-white">
      <h2 className="text-lg sm:text-xl font-black italic uppercase px-2">My Picks</h2>
      
      {/* Aggressively reduced mobile padding (p-2) and gaps (space-y-1.5) */}
      <div className="bg-slate-800/80 backdrop-blur-md p-2 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-700 space-y-1.5 sm:space-y-3 shadow-2xl">
        {formFields.map(f => {
          const isFocused = focusedField === f.id;
          const currentInput = picks[f.id] || "";
          const filteredSongs = PHISH_SONGS.filter(song => 
            song.toLowerCase().includes(currentInput.toLowerCase())
          ).slice(0, 8);
          const showDropdown = isFocused && currentInput.length > 0 && filteredSongs.length > 0;

          return (
            <div key={f.id} className={`relative ${isFocused ? 'z-50' : 'z-10'}`}>
              {/* Removed bottom margin on mobile to pull input closer to label */}
              <label className="text-[10px] sm:text-xs font-black uppercase text-slate-400 ml-2 sm:ml-3 mb-0 sm:mb-1 block">
                {f.label}
              </label>
              
              <input 
                type="text" 
                name={`phish-song-entry-${f.id}`} 
                // The Combobox Hack to defeat Chrome's password manager
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showDropdown}
                autoComplete="off" 
                autoCorrect="off"
                spellCheck="false"
                data-lpignore="true"
                data-1p-ignore="true"
                placeholder="Type a song..."
                value={picks[f.id]}
                onChange={(e) => {
                  setPicks({ ...picks, [f.id]: e.target.value });
                  setHighlightedIndex(-1);
                }}
                onFocus={() => handleFocus(f.id)}
                onBlur={handleBlur}
                onKeyDown={(e) => handleKeyDown(e, f.id, filteredSongs)}
                /* Significantly reduced vertical padding (py-1.5) on mobile to save height, kept text-base to prevent zoom */
                className="w-full bg-white border-2 border-slate-300 py-1.5 px-3 sm:p-3 rounded-xl text-base font-black text-slate-900 outline-none focus:border-blue-500 transition-all shadow-md placeholder:text-slate-400"
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
                      className={`px-4 py-2 sm:py-3 text-sm font-bold cursor-pointer border-b border-slate-800 last:border-0 ${
                        highlightedIndex === index ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
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

        {/* Shrunk the button height slightly on mobile and reduced top margin */}
        <button 
          onClick={handleSavePicks}
          className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white py-2 sm:py-3.5 rounded-xl font-black text-sm uppercase tracking-widest hover:from-blue-400 hover:to-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 mt-2 sm:mt-4 border border-white/10"
        >
          {saveStatus || "Lock In Picks"}
        </button>
      </div>
    </div>
  );
};

export default PicksForm;