import React, { useState, useRef } from 'react';

const AdminForm = ({ adminResults, setAdminResults, formFields, handleSaveResults, saveStatus, PHISH_SONGS }) => {
  const [focusedField, setFocusedField] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const blurTimeoutRef = useRef(null);

  const handleFocus = (fieldId) => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setFocusedField(fieldId);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setFocusedField(null);
    }, 200);
  };

  return (
    <div className="space-y-6">
      <div className="px-2">
        <h2 className="text-xl font-black italic uppercase text-white">Admin Control</h2>
      </div>
      
      <div className="bg-slate-800/80 p-6 rounded-[2.5rem] border border-emerald-500/30 space-y-5 shadow-xl">
        <h3 className="text-center font-black text-emerald-400 uppercase tracking-widest text-sm">
          Master Setlist
        </h3>
        
        {formFields.map((f) => {
          const isFocused = focusedField === f.id;
          const currentInput = adminResults[f.id] || "";
          const filteredSongs = PHISH_SONGS.filter(song => 
            song.toLowerCase().includes(currentInput.toLowerCase())
          ).slice(0, 8);
          const showDropdown = isFocused && currentInput.length > 0 && filteredSongs.length > 0;

          return (
            <div key={f.id} className={`relative ${isFocused ? 'z-50' : 'z-10'}`}>
              <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-1 block">
                {f.label}
              </label>
              <input 
                type="text"
                autoComplete="off"
                value={adminResults[f.id] || ""} 
                onChange={(e) => {
                  setAdminResults({ ...adminResults, [f.id]: e.target.value });
                  setHighlightedIndex(-1);
                }}
                onFocus={() => handleFocus(f.id)}
                onBlur={handleBlur}
                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-emerald-500 transition-colors" 
                placeholder="Actual song..." 
              />

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl z-[100]">
                  {filteredSongs.map((song, index) => (
                    <div 
                      key={song}
                      onMouseDown={() => {
                        setAdminResults({ ...adminResults, [f.id]: song });
                        setFocusedField(null);
                      }}
                      className="px-5 py-3 text-sm font-bold cursor-pointer text-slate-300 hover:bg-emerald-600 hover:text-white border-b border-slate-800 last:border-0"
                    >
                      {song}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        
        <button 
          onClick={handleSaveResults} 
          className="w-full bg-emerald-600 py-5 rounded-3xl font-black text-black hover:bg-emerald-500 transition-colors mt-4 shadow-lg active:scale-95"
        >
          {saveStatus || "PUBLISH RESULTS"}
        </button>
      </div>
    </div>
  );
};

export default AdminForm;
