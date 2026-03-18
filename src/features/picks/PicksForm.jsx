import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FORM_FIELDS } from '../../data/gameConfig';
import { getShowStatus } from '../../utils/timeLogic';
import { PHISH_SONGS } from '../../data/PhishSongs.js';

// --- CUSTOM AUTOCOMPLETE COMPONENT ---
// We build this right here so it can be perfectly styled for your app
const SongAutocomplete = ({ value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const wrapperRef = useRef(null);

  // Closes the dropdown if the user clicks anywhere else on the screen
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

    // Only start searching if they typed at least 2 characters
    if (val.length > 1) {
      const matches = PHISH_SONGS.filter(song => 
        // Handles both strings or rich objects just in case
        (typeof song === 'string' ? song : song.name).toLowerCase().includes(val.toLowerCase())
      ).slice(0, 10); // Only show top 10 so it doesn't lag the screen
      
      setFilteredSongs(matches);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelect = (songName) => {
    onChange(songName);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => value.length > 1 && setIsOpen(true)}
        placeholder={placeholder}
        autoComplete="off" /* Kills the ugly browser default */
        className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full"
      />
      
      {/* THE CUSTOM FLOATING DROPDOWN */}
      {isOpen && filteredSongs.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden">
          {filteredSongs.map((song, index) => {
            const songName = typeof song === 'string' ? song : song.name;
            const songGap = song.gap && song.gap !== '—' ? song.gap : 'N/A';
            const songLast = song.last && song.last !== '—' ? song.last : 'Never/Alias';

            return (
              <li 
                key={index}
                onClick={() => handleSelect(songName)}
                className="px-4 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-b-0 transition-colors"
              >
                <div className="font-bold text-white text-base truncate">{songName}</div>
                {typeof song !== 'string' && (
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                    Gap: {songGap} <span className="text-slate-500 px-1">•</span> Last: {songLast}
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
        
        {/* THE TIME MACHINE LOCK */}
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
              
              {/* WE REPLACED THE HTML INPUT WITH OUR CUSTOM COMPONENT! */}
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