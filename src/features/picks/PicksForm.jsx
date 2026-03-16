import React, { useState, useRef } from 'react';

const PicksForm = ({ picks, setPicks, formFields, PHISH_SONGS, handleSavePicks, saveStatus }) => {
  const [focusedField, setFocusedField] = useState(null);
  const blurTimeoutRef = useRef(null);

  const handleFocus = (fieldId) => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setFocusedField(fieldId);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => setFocusedField(null), 200);
  };

  return (
    <div className="space-y-6 pb-20 text-white">
      <h2 className="text-xl font-black italic uppercase px-2">My Picks</h2>
      
      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-700 space-y-6 shadow-2xl">
        {formFields.map(f => {
          const isFocused = focusedField === f.id;
          const currentInput = picks[f.id] || "";
          const filteredSongs = PHISH_SONGS.filter(song => 
            song.toLowerCase().includes(currentInput.toLowerCase())
          ).slice(0, 8);
          const showDropdown = isFocused && currentInput.length > 0 && filteredSongs.length > 0;

          return (
            <div key={f.id} className={`relative ${isFocused ? 'z-50' : 'z-10'}`}>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1.5 block">
                {f.label}
              </label>
              
              <input 
                type="text"
                autoComplete="off"
                placeholder="Type a song..."
                value={picks[f.id]}
                onChange={(e) => setPicks({ ...picks, [f.id]: e.target.value })}
                onFocus={() => handleFocus(f.id)}
                onBlur={handleBlur}
                className="w-full bg-white border-2 border-slate-300 p-4 rounded-2xl text-base font-black text-slate-900 outline-none focus:border-blue-500 transition-all shadow-md placeholder:text-slate-400"
              />

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl z-[100]">
                  {filteredSongs.map((song) => (
                    <div 
                      key={song}
                      onMouseDown={() => {
                        setPicks({ ...picks, [f.id]: song });
                        setFocusedField(null);
                      }}
                      className="px-5 py-4 text-sm font-bold cursor-pointer text-slate-300 hover:bg-blue-600 hover:text-white border-b border-slate-800 last:border-0"
                    >
                      {song}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* THE NEW INTERESTING BUTTON */}
        <button 
          onClick={handleSavePicks}
          className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white py-5 rounded-3xl font-black text-base uppercase tracking-widest hover:from-blue-400 hover:to-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 mt-6 border border-white/10"
        >
          {saveStatus || "Lock In Picks"}
        </button>
      </div>
    </div>
  );
};

export default PicksForm;
