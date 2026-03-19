import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Profile({ user }) {
  const [handle, setHandle] = useState('');
  const [favoriteSong, setFavoriteSong] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch existing user data on load
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setHandle(data.handle || '');
          setFavoriteSong(data.favoriteSong || '');
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    if (!handle.trim()) {
      setMessage({ text: 'Handle is required.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        handle: handle.trim(),
        favoriteSong: favoriteSong.trim() || 'Unknown',
        updatedAt: new Date().toISOString()
      });
      
      setMessage({ text: 'Profile updated successfully! 🎸', type: 'success' });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ text: 'Error saving profile. Try again.', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-4 pb-12">
      <h2 className="text-2xl font-black italic uppercase mb-6 text-white tracking-tight">
        Your Profile
      </h2>

      <form 
        onSubmit={handleSave}
        className="space-y-6 bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50"
      >
        {/* Handle Input */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Display Name / Handle
          </label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="e.g., CactusMike99"
            className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full"
          />
          <p className="text-[10px] text-slate-500 mt-1 ml-1">
            This is how you will appear on the Leaderboard and in Pools.
          </p>
        </div>

        {/* Favorite Song Input */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Favorite Phish Song
          </label>
          <input
            type="text"
            value={favoriteSong}
            onChange={(e) => setFavoriteSong(e.target.value)}
            placeholder="e.g., You Enjoy Myself"
            className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full"
          />
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-lg py-4 rounded-xl uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Update Profile'}
          </button>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div className={`text-center font-bold text-sm mt-4 ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}