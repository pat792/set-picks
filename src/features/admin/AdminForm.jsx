import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FORM_FIELDS } from '../../data/gameConfig'; // <-- THE SINGLE SOURCE OF TRUTH
import SongAutocomplete from '../../components/SongAutocomplete';
import Button from '../../components/ui/Button';

export default function AdminForm({ user, selectedDate }) {
  // Dynamically create our initial state based on whatever is in gameConfig.js
  const [setlistData, setSetlistData] = useState(() => {
    const initialState = {};
    FORM_FIELDS.forEach(field => {
      initialState[field.id] = '';
    });
    return initialState;
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Security Check
  const isAdmin = user?.email === 'pat@road2media.com';

  // 1. Load the existing official setlist if already saved
  useEffect(() => {
    const fetchOfficialSetlist = async () => {
      if (!selectedDate || !isAdmin) return;
      
      try {
        // CHANGED: Pointing to the new collection
        const docRef = doc(db, 'official_setlists', selectedDate);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // CHANGED: We now look inside data.setlist to populate the form
          setSetlistData(prev => ({ ...prev, ...(data.setlist || {}) }));
        } else {
          // Reset to blank if no data for this date
          const resetState = {};
          FORM_FIELDS.forEach(f => resetState[f.id] = '');
          setSetlistData(resetState);
        }
      } catch (error) {
        console.error("Error fetching setlist:", error);
      }
    };

    fetchOfficialSetlist();
  }, [selectedDate, isAdmin]);

  // 2. Handle dynamic input changes
  const handleInputChange = (fieldId, value) => {
    setSetlistData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // 3. Save to Firestore
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // Clean up the data (trim whitespace) before saving
      const cleanedData = {};
      Object.keys(setlistData).forEach(key => {
        cleanedData[key] = typeof setlistData[key] === 'string' ? setlistData[key].trim() : setlistData[key];
      });

      // CHANGED: Pointing to the new collection
      const docRef = doc(db, 'official_setlists', selectedDate);
      
      // CHANGED: Writing the exact Issue #66 Schema
      await setDoc(docRef, {
        showDate: selectedDate,
        status: "COMPLETED", // Triggers the future Cloud Function
        isScored: false,     // Tells the Cloud Function this needs grading
        updatedAt: new Date().toISOString(),
        updatedBy: user.email,
        setlist: cleanedData // Our perfectly flat object of songs
      });

      setMessage({ text: 'OFFICIAL SETLIST LOCKED 🔒', type: 'success' });
    } catch (error) {
      console.error("Error saving setlist:", error);
      setMessage({ text: 'Error saving setlist.', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }
  };

  if (!isAdmin) {
    return <div className="text-center mt-20 text-red-500 font-bold">UNAUTHORIZED ACCESS</div>;
  }

  return (
    <div className="max-w-xl mx-auto mt-4 pb-12">
      <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl mb-6">
        <p className="text-xs text-red-300/80 font-bold uppercase tracking-wider flex items-start gap-2">
          <span aria-hidden className="shrink-0">
            ⚠️
          </span>
          <span>
            Locking the official setlist for {selectedDate}. This will trigger scoring.
          </span>
        </p>
      </div>

      <form 
        onSubmit={handleSave}
        className="space-y-6 bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50"
      >
        {/* DYNAMICALLY RENDERED INPUTS FROM gameConfig.js */}
        {FORM_FIELDS.map((field) => (
          <div key={field.id} className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Official {field.label}
            </label>
            
            {/* THIS IS THE FIX: Using the predictive text component instead of <input> */}
            <SongAutocomplete
              value={setlistData[field.id] || ''}
              onChange={(val) => handleInputChange(field.id, val)}
              placeholder={`e.g., ${field.placeholder || 'Song Name'}`}
            />
            
          </div>
        ))}

        {/* Save Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            type="submit"
            disabled={isSaving}
            className="w-full bg-red-500 hover:bg-red-400 text-white text-lg py-4 rounded-xl uppercase tracking-widest shadow-lg hover:shadow-red-500/20"
          >
            {isSaving ? 'UPDATING DB...' : 'LOCK OFFICIAL SETLIST'}
          </Button>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div className={`text-center font-bold text-sm mt-4 uppercase tracking-widest ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}