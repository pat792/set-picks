// src/components/SongAutocomplete.jsx

import React, { useState, useEffect, useRef } from 'react';
import { PHISH_SONGS } from '../data/phishSongs.js';

export default function SongAutocomplete({ value, onChange, placeholder, onSongSelected }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);

    if (val.length > 0) {
      const matches = PHISH_SONGS.filter(song => 
        (typeof song === 'string' ? song : song.name).toLowerCase().includes(val.toLowerCase())
      ).slice(0, 10);
      
      setFilteredSongs(matches);
      setIsOpen(true);
      setActiveIndex(-1);
    } else {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSelect = (songName) => {
    onChange(songName);
    onSongSelected?.(songName);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeIndex < filteredSongs.length - 1) {
        setActiveIndex((prev) => prev + 1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeIndex > 0) {
        setActiveIndex((prev) => prev - 1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filteredSongs[activeIndex]) {
        const songToSelect = typeof filteredSongs[activeIndex] === 'string' 
          ? filteredSongs[activeIndex] 
          : filteredSongs[activeIndex].name;
        handleSelect(songToSelect);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length > 1 && setIsOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full"
      />
      
      {isOpen && filteredSongs.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden"
        >
          {filteredSongs.map((song, index) => {
            const songName = typeof song === 'string' ? song : song.name;
            const songGap = song.gap && song.gap !== '—' ? song.gap : 'N/A';
            const songLast = song.last && song.last !== '—' ? song.last : 'Never';
            const songTotal =
              typeof song !== 'string' && song.total && song.total !== '—'
                ? song.total
                : 'N/A';
            const isKeyboardActive = index === activeIndex;
            return (
              <li 
                key={index}
                role="option"
                aria-selected={isKeyboardActive}
                onClick={() => handleSelect(songName)}
                className={`border-b border-slate-700/50 last:border-b-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-3 cursor-pointer transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 ${
                  isKeyboardActive
                    ? 'bg-slate-700 ring-1 ring-inset ring-teal-400/60'
                    : 'md:hover:bg-slate-700/50'
                }`}
              >
                <div className="text-base font-bold text-slate-200 whitespace-normal break-words text-left">
                  {songName}
                </div>
                
                {typeof song !== 'string' && (
                  <div className="inline-flex flex-wrap items-baseline justify-start sm:justify-end gap-x-1.5 gap-y-0.5 text-xs sm:text-sm font-medium text-slate-400 tabular-nums text-left sm:text-right">
                    <span className="whitespace-nowrap">
                      <span className="text-slate-500">Total:</span> {songTotal}
                    </span>
                    <span className="whitespace-nowrap">
                      <span className="text-slate-500">Gap:</span> {songGap}
                    </span>
                    <span className="whitespace-nowrap">
                      <span className="text-slate-500">Last:</span> {songLast}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}