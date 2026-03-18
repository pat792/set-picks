import React, { useState } from 'react';
import { doc, setDoc } from "firebase/firestore";
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/useAuth';

// 1. Importing the Lego Block and the Database!
import AutocompleteInput from '../../components/AutocompleteInput';
import { PHISH_SONGS } from '../../data/phishSongs';

const FORM_FIELDS = [
  { id: "s1o", label: "Set 1 Opener" },
  { id: "s1c", label: "Set 1 Closer" },
  { id: "s2o", label: "Set 2 Opener" },
  { id: "s2c", label: "Set 2 Closer" },
  { id: "enc", label: "Encore" },
  { id: "wild", label: "Wildcard" }
];

export default function PicksForm({ selectedDate = "next_show" }) {
  const { user, userProfile } = useAuth();
  
  const [picks, setPicks] = useState({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });
  const [saveStatus, setSaveStatus] = useState("");

  const handleInputChange = (fieldId, newValue) => {
    setPicks(prev => ({ ...prev, [fieldId]: newValue }));
  };

  const handleSavePicks = async () => {
    if (!user || !userProfile) return;
    
    setSaveStatus("Saving...");
    try {
      const pickId = `${selectedDate}_${user.uid}`;
      await setDoc(doc(db, "picks", pickId), { 
        ...picks, 
        uid: user.uid, 
        handle: userProfile.handle, 
        date: selectedDate, 
        updatedAt: new Date().toISOString() 
      });
      setSaveStatus("✅ Picks Locked In!");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (e) { 
      setSaveStatus("❌ Error."); 
    }
  };

  return (
    <div className="pb-24 text-white">
      <h2 className="text-lg sm:text-xl font-black italic uppercase px-2 mb-2 sm:mb-4">My Picks</h2>
      
      <div className="bg-slate-800/80 backdrop-blur-md p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-700 shadow-2xl">
        
        {/* THE HONEYPOT */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <input type="text" name="fake_email" autoComplete="email" />
          <input type="password" name="fake_password" autoComplete="current-password" />
        </div>

        {/* Look how clean this map is now! */}
        <div className="flex flex-col gap-2.5 sm:gap-4">
          {FORM_FIELDS.map(f => (
            <AutocompleteInput
              key={f.id}
              id={f.id}
              label={f.label}
              value={picks[f.id]}
              onChange={handleInputChange}
              options={PHISH_SONGS} /* Passing your massive list here! */
            />
          ))}
        </div>

        <div className="mt-6 sm:mt-8">
          <button 
            onClick={handleSavePicks}
            className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white py-3 sm:py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/20"
          >
            {saveStatus || "Lock In Picks"}
          </button>
        </div>

      </div>
    </div>
  );
}