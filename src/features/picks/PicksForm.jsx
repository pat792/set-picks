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
      
      // FLIPPED: Date comes first now for database grouping!
      const pickId = `${selectedDate}_${user.uid}`; 
      const docRef = doc(db, "picks", pickId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPicks(data.picks || {});
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
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      
      let customHandle = user.displayName || user.email?.split('@')[0] || "Anonymous";
      
      if (userSnap.exists() && userSnap.data().handle) {
        customHandle = userSnap.data().handle;
      }

      // FLIPPED: Date comes first now for database grouping!
      const pickId = `${selectedDate}_${user.uid}`; 
      
      await setDoc(doc(db, "picks", pickId), {
        userId: user.uid,
        handle: customHandle,
        showDate: selectedDate, 
        updatedAt: new Date().toISOString(),
        score: 0,               
        isGraded: false,        
        picks: picks            
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