import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FORM_FIELDS } from '../../data/gameConfig';
import { getShowStatus } from '../../utils/timeLogic';
import { PHISH_SONGS } from '../../data/phishSongs.js'; // Fixed lowercase 'p'

// --- CUSTOM AUTOCOMPLETE COMPONENT ---
const SongAutocomplete = ({ value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1); // Tracks keyboard highlight
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

    if (val.length > 1) {
      const matches = PHISH_SONGS.filter(song => 
        (typeof song === 'string' ? song : song.name).toLowerCase().includes(val.toLowerCase())
      ).slice(0, 10);
      
      setFilteredSongs(matches);
      setIsOpen(true);
      setActiveIndex(-1); // Reset keyboard highlight when typing
    } else {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSelect = (songName) => {
    onChange(songName);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  // NEW: The Keyboard Listener
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault(); // Stops cursor from jumping to the end of the input
      if (activeIndex < filteredSongs.length - 1) {
        setActiveIndex((prev) => prev + 1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeIndex > 0) {
        setActiveIndex((prev) => prev - 1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault(); // CRITICAL: Stops the form from submitting!
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
        onKeyDown={handleKeyDown} // Attached the keyboard listener
        onFocus={() => value.length > 1 && setIsOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full"
      />
      
      {isOpen && filteredSongs.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden">
          {filteredSongs.map((song, index) => {
            const songName = typeof song === 'string' ? song : song.name;
            const songGap = song.gap && song.gap !== '—' ? song.gap : 'N/A';
            const songLast = song.last && song.last !== '—' ? song.last : 'Never';

            return (
              <li 
                key={index}
                onClick={() => handleSelect(songName)}
                // NEW: Applies the bg-slate-700 highlight if this is the activeIndex
                className={`px-4 py-3 cursor-pointer border-b border-slate-700/50 last:border-b-0 transition-colors flex justify-between items-center ${
                  index === activeIndex ? 'bg-slate-700' : 'hover:bg-slate-700'
                }`}
              >
                <div className="font-bold text-white text-base truncate pr-4">{songName}</div>
                
                {typeof song !== 'string' && (
                  <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest whitespace-nowrap text-right shrink-0">
                    <span className="text-slate-500">Gap:</span> {songGap} 
                    <span className="text-slate-600 mx-2">|</span> 
                    <span className="text-slate-500">Last:</span> {songLast}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// --- MAIN PICKS FORM COMPONENT ---
export default function PicksForm({ user, selectedDate }) {
  const [picks, setPicks] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const showStatus = getShowStatus(selectedDate);

  useEffect(() => {
    const loadExistingPicks = async () => {
      if (!user?.uid || !selectedDate) return;
      
      const pickId = `${selectedDate}_${user.uid}`;
      const docRef = doc(db, "picks", pickId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setPicks(docSnap.data());
      } else {
        setPicks({}); 
      }
    };

    loadExistingPicks();
  }, [selectedDate, user]);

  const handleInputChange = (fieldId, value) => {
    setPicks(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      setSaveMessage('Error: You must be logged in to save picks.');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const pickId = `${selectedDate}_${user.uid}`;
      
      await setDoc(doc(db, "picks", pickId), {
        ...picks,
        userId: user.uid,
        handle: user.displayName || user.email?.split('@')[0] || "Anonymous",
        date: selectedDate,
        updatedAt: new Date().toISOString()
      });
      
      setSaveMessage('Picks locked in successfully! 🎸');
    } catch (error) {
      console.error("Error saving picks:", error);
      setSaveMessage('Error saving picks. Please try again.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-4 pb-12">
      <h2 className="text-2xl font-black italic uppercase mb-6 text-white tracking-tight">
        Make Your Picks
      </h2>

      <div className="relative">
        
        {showStatus !== 'NEXT' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-700/50">
            <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl text-center max-w-sm border border-slate-600 transform transition-all">
              <span className="text-5xl block mb-4">
                {showStatus === 'PAST' ? '🔒' : '⏳'}
              </span>
              <h3 className="text-xl font-black italic text-white mb-2">
                {showStatus === 'PAST' ? 'PICKS LOCKED' : 'TOO EARLY'}
              </h3>
              <p className="text-slate-400 text-sm font-bold leading-relaxed">
                {showStatus === 'PAST' 
                  ? "This show has already happened! Practice Mode is coming soon."
                  : "Picks for this show will open after the previous show ends."}
              </p>
            </div>
          </div>
        )}

        <form 
          onSubmit={handleSave}
          className={`space-y-4 bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 transition-all duration-300 ${
            showStatus !== 'NEXT' ? 'opacity-30 pointer-events-none blur-[1px]' : ''
          }`}
        >
          {FORM_FIELDS.map((field) => (
            <div key={field.id} className="flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
                {field.label}
              </label>
              
              <SongAutocomplete
                value={picks[field.id] || ''}
                onChange={(val) => handleInputChange(field.id, val)}
                placeholder="Type a song..."
              />

            </div>
          ))}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-lg py-4 rounded-xl uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Lock In Picks'}
            </button>
          </div>

          {saveMessage && (
            <div className={`text-center font-bold text-sm mt-4 ${saveMessage.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
              {saveMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}