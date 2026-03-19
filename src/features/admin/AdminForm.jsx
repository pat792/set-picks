import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function AdminForm({ user, selectedDate }) {
  const [setOneOpener, setSetOneOpener] = useState('');
  const [setTwoOpener, setSetTwoOpener] = useState('');
  const [encore, setEncore] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Security Check: Double-verify this is you
  const isAdmin = user?.email === 'pat@road2media.com';

  // Load the existing official setlist if you already saved it
  useEffect(() => {
    const fetchOfficialSetlist = async () => {
      if (!selectedDate || !isAdmin) return;
      
      try {
        const docRef = doc(db, 'setlists', selectedDate);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSetOneOpener(data.setOneOpener || '');
          setSetTwoOpener(data.setTwoOpener || '');
          setEncore(data.encore || '');
        } else {
          // Reset if no data for this date
          setSetOneOpener('');
          setSetTwoOpener('');
          setEncore('');
        }
      } catch (error) {
        console.error("Error fetching setlist:", error);
      }
    };

    fetchOfficialSetlist();
  }, [selectedDate, isAdmin]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // We use the date (e.g., '2026-04-18') as the document ID!
      const docRef = doc(db, 'setlists', selectedDate);
      await setDoc(docRef, {
        date: selectedDate,
        setOneOpener: setOneOpener.trim(),
        setTwoOpener: setTwoOpener.trim(),
        encore: encore.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: user.email
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
        <h2 className="text-xl font-black italic uppercase text-red-400 tracking-tight flex items-center gap-2">
          <span>⚠️</span> ADMIN WAR ROOM
        </h2>
        <p className="text-xs text-red-300/80 font-bold uppercase tracking-wider mt-1">
          You are updating the master scorecard. This will calculate points for all users.
        </p>
      </div>

      <form 
        onSubmit={handleSave}
        className="space-y-6 bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50"
      >
        {/* Set 1 Opener */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Official Set 1 Opener
          </label>
          <input
            type="text"
            value={setOneOpener}
            onChange={(e) => setSetOneOpener(e.target.value)}
            placeholder="e.g., Chalk Dust Torture"
            className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-blue-500 transition-colors w-full"
          />
        </div>

        {/* Set 2 Opener */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Official Set 2 Opener
          </label>
          <input
            type="text"
            value={setTwoOpener}
            onChange={(e) => setSetTwoOpener(e.target.value)}
            placeholder="e.g., Down with Disease"
            className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-blue-500 transition-colors w-full"
          />
        </div>

        {/* Encore */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Official Encore
          </label>
          <input
            type="text"
            value={encore}
            onChange={(e) => setEncore(e.target.value)}
            placeholder="e.g., Character Zero"
            className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-blue-500 transition-colors w-full"
          />
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-red-500 hover:bg-red-400 text-white font-black text-lg py-4 rounded-xl uppercase tracking-widest transition-all shadow-lg hover:shadow-red-500/20 disabled:opacity-50"
          >
            {isSaving ? 'UPDATING DB...' : 'LOCK OFFICIAL SETLIST'}
          </button>
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