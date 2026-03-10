import React, { useState } from 'react';

const PicksForm = ({ picks, setPicks, formFields, PHISH_SONGS, handleSavePicks, saveStatus }) => {
  const [focusedField, setFocusedField] = useState(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-black italic uppercase">My Picks</h2>
      </div>
      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-700 space-y-5">
        {formFields.map(f => {
          const isFocused = focusedField === f.id;
          const showDropdown = isFocused && picks[f.id].length > 0;
          const filtered = PHISH_SONGS.filter(s => s.toLowerCase().includes(picks[f.id].toLowerCase()));
          
          return (
            /* The fix: Dynamic Z-index on the wrapper */
            <div key={f.id} className={`relative ${isFocused ? 'z-50' : 'z-0'}`}>
              <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-1 block">{f.label}</label>
              <input 
                placeholder="Type a song..." 
                value={picks[f.id]}
                onChange={(e) => setPicks({ ...picks, [f.id]: e.target.value })}
                onFocus={() => setFocusedField(f.id)}
                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-colors" 
              />
              {showDropdown && filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl z-[100] max-h-48 overflow-y-auto shadow-2xl">
                  {filtered.map(s => (
                    <div 
                      key={s} 
                      onClick={() => {
                        setPicks({ ...picks, [f.id]: s });
                        setFocusedField(null);
                      }} 
                      className="p-4 text-sm font-bold border-b border-slate-700/50 hover:bg-slate-700 cursor-pointer"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <button 
          onClick={handleSavePicks} 
          className="w-full bg-blue-600 py-5 rounded-3xl font-black tracking-widest shadow-xl active:scale-95 transition-transform"
        >
          {saveStatus || "LOCK IN PICKS"}
        </button>
      </div>
    </div>
  );
};

export default PicksForm;
