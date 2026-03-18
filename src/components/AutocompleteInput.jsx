import React, { useState, useRef } from 'react';

export default function AutocompleteInput({ label, id, value, onChange, options = [] }) {
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const blurTimeoutRef = useRef(null);

  const handleFocus = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setIsFocused(true);
    setHighlightedIndex(-1);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
      setHighlightedIndex(-1);
    }, 200);
  };

  const filteredOptions = options
    ?.filter(opt => opt?.name?.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 8) || [];

  const showDropdown = isFocused && value.length > 0 && filteredOptions.length > 0;

  const handleKeyDown = (e) => {
    if (!isFocused || filteredOptions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      onChange(id, filteredOptions[highlightedIndex].name);
      setIsFocused(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className={`relative ${isFocused ? 'z-50' : 'z-10'}`}>
      <label className="text-[10px] sm:text-xs font-black uppercase text-slate-400 ml-2 sm:ml-3 mb-0.5 sm:mb-1 block">
        {label}
      </label>
      
      <input 
        type="text" 
        inputMode="search"
        autoComplete="off" autoCorrect="off" spellCheck="false" autoCapitalize="words"
        placeholder="Type a song..."
        value={value}
        onChange={(e) => {
          onChange(id, e.target.value);
          setHighlightedIndex(-1);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-slate-900 border-2 border-slate-700 py-2.5 px-4 rounded-xl text-base font-bold text-white outline-none focus:border-emerald-500 transition-all shadow-md placeholder:text-slate-500"
      />

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-[100]">
          {filteredOptions.map((song, index) => (
            <div 
              key={song.name}
              onMouseDown={() => {
                onChange(id, song.name);
                setIsFocused(false);
                setHighlightedIndex(-1);
              }}
              className={`px-4 py-2 sm:py-3 cursor-pointer border-b border-slate-800 last:border-0 flex justify-between items-center ${
                highlightedIndex === index ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-sm font-bold pr-4">{song.name}</span>
              
              {/* NEW: Display both the Gap and Last Played stacked on the right */}
              <div className="flex flex-col items-end gap-1">
                {song.gap !== "—" && (
                  <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    highlightedIndex === index ? 'bg-white/20' : 'bg-slate-700 text-slate-400'
                  }`}>
                    Gap: {song.gap}
                  </span>
                )}
                {song.last !== "—" && (
                  <span className={`text-[9px] sm:text-[10px] font-bold ${
                    highlightedIndex === index ? 'text-emerald-100' : 'text-slate-500'
                  }`}>
                    Last: {song.last}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}