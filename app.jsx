import React, { useState, useEffect, useRef } from 'react';

// --- PHISH SONG DATABASE ---
const PHISH_SONGS = ["46 Days", "AC/DC Bag", "Carini", "Ghost", "Harry Hood", "Tweezer", "You Enjoy Myself"].sort();

// --- MOCK FIREBASE (To bypass build errors) ---
const auth = null;
const db = null;
const appId = 'demo-mode';

export default function App() {
  const [activeTab, setActiveTab] = useState("picks");
  const [profile, setProfile] = useState({ displayName: "" });
  const [picks, setPicks] = useState({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-3xl font-black text-blue-800 mb-4">⭕ Phish Pool</h1>
        <p className="text-slate-600 mb-6">Prototype Mode: Vercel is Live!</p>
        
        <div className="space-y-4">
          <label className="block font-bold">Display Name</label>
          <input 
            type="text" 
            className="w-full p-3 border rounded-lg" 
            placeholder="Couch Boy"
            value={profile.displayName}
            onChange={(e) => setProfile({displayName: e.target.value})}
          />
          
          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">
            Lock In Picks (Demo)
          </button>
        </div>
      </div>
    </div>
  );
}
