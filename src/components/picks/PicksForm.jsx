import React, { useState } from 'react';

const PicksForm = ({ picks, setPicks, formFields, PHISH_SONGS, handleSavePicks, saveStatus }) => {
  const [focusedField, setFocusedField] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-black italic uppercase">My Picks</h2>
      </div>
      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-700 space-y-5">
        {formFields.map(f => {
          const isFocused = focusedField === f.id;
          const filteredSongs = PHISH_SONGS.filter(song => 
            song.toLowerCase().includes(picks[f.id].toLowerCase())
          );
          const showDropdown = isFocused && picks[f.id].length > 0 && filteredSongs.length > 0;

          return (
            <div key={f.id} className={`relative ${isFocused ? 'z-50' : 'z-0'}`}>
              <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-1 block">{f.label}</label>
              <input 
                placeholder="Type a song..." 
                value={picks[f.id]}
                onChange={(e) => {
                  setPicks({ ...picks, [f.id]: e.target.value });
                  setHighlightedIndex(-1); // Reset highlight when typing
                }}
                onFocus={() => {
                  setFocusedField(f.id);
                  setHighlightedIndex(-1);
                }}
                onBlur={() => {
                  // Small delay to allow click selection to register
                  setTimeout(() => setFocusedField(null), 200);
                }}
                onKeyDown={(e) => {
                  if (!showDropdown) return;

                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIndex(prev => 
                      prev < filteredSongs.length - 1 ? prev + 1 : prev
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const selectedSong = highlightedIndex >= 0 ? filteredSongs[highlightedIndex] : filteredSongs[0];
                    if (selectedSong) {
                      setPicks({ ...picks, [f.id]: selectedSong });
                      setFocusedField(null);
                      setHighlightedIndex(-1);
                    }
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-colors" 
              />
              
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl z-[100] max-h-48 overflow-y-auto shadow-2xl">
                  {filteredSongs.map((song, index) => (
                    <div 
                      key={song} 
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur before selection
                        setPicks({ ...picks, [f.id]: song });
                        setFocusedField(null);
                      }} 
                      className={`p-4 text-sm font-bold border-b border-slate-700/50 cursor-pointer transition-colors ${
                        highlightedIndex === index ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'
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
        <button 
          onClick={handleSavePicks} 
          className="w-full bg-blue-600 py-5 rounded-3xl font-black tracking-widest shadow-xl active:scale-95 transition-transform mt-4"
        >
          {saveStatus || "LOCK IN PICKS"}
        </button>
      </div>
    </div>
  );
};

export default PicksForm;
