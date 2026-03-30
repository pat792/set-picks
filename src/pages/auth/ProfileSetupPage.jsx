import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../shared/lib/firebase';
import Button from '../../shared/ui/Button';

export default function ProfileSetup({ user }) {
  const [handle, setHandle] = useState("");
  const [favoriteSong, setFavoriteSong] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!handle.trim()) return;
    
    setIsSaving(true);
    setError("");

    try {
      await setDoc(doc(db, "users", user.uid), {
        handle: handle.trim(),
        email: user.email,
        favoriteSong: favoriteSong.trim() || "Unknown",
        createdAt: new Date().toISOString(),
        totalPoints: 0 
      });
      
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      setError("Failed to create profile. Try again.");
      setIsSaving(false);
    }
  };

  return (
        <div className="min-h-screen w-full bg-indigo-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-800/50 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
        
                <h2 className="font-display text-display-xl md:text-display-xl-lg font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
          ALMOST THERE
        </h2>
        
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">
          Complete your profile to enter the pool.
        </p>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
          <div className="flex flex-col text-left gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Username / Handle *</label>
            <input 
              type="text" 
              placeholder="e.g. LawnBoy99" 
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 font-bold text-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
              maxLength={20}
              required
            />
          </div>

          <div className="flex flex-col text-left gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Favorite Song (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. You Enjoy Myself" 
              value={favoriteSong}
              onChange={(e) => setFavoriteSong(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 font-medium text-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          
          {error && <p className="text-red-400 text-xs font-bold uppercase">{error}</p>}
          
          {/* UPDATED: The Kuroda Neon Green Button */}
          <Button
            variant="primary"
            type="submit" 
            disabled={isSaving || !handle.trim()}
            className="w-full bg-green-400 hover:bg-green-300 text-green-950 p-4 uppercase tracking-widest shadow-[0_0_15px_rgba(74,222,128,0.4)] hover:scale-[1.02] mt-4"
          >
            {isSaving ? "Saving..." : "Lock Profile In"}
          </Button>
        </form>
      </div>
    </div>
  );
}