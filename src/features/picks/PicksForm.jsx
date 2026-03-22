import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FORM_FIELDS } from '../../data/gameConfig';
import { getShowStatus } from '../../utils/timeLogic';
import SongAutocomplete from '../../components/SongAutocomplete';

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
      // 1. Fetch the custom handle from your users table
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      
      // Default to Google name/email if they haven't set up a profile yet
      let customHandle = user.displayName || user.email?.split('@')[0] || "Anonymous";
      
      // Override with custom handle if it exists in the database
      if (userSnap.exists() && userSnap.data().handle) {
        customHandle = userSnap.data().handle;
      }

      const pickId = `${selectedDate}_${user.uid}`;
      
      // 2. Save the picks using the true custom handle
      await setDoc(doc(db, "picks", pickId), {
        ...picks,
        userId: user.uid,
        handle: customHandle, // <-- Now using the custom handle!
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
      {/* HIDDEN ON MOBILE */}
      <h2 className="hidden md:block text-2xl font-black mb-6 text-white tracking-tight">
        Make Picks
      </h2>

      <div className="relative">
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
              
              {/* CLEAN AND MODULAR */}
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