import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Leaderboard from '../../components/Leaderboard.jsx';
// NEW: Import the referee!
import { getShowStatus } from '../../utils/timeLogic.js';

export default function Standings({ selectedDate }) {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: Ask the referee what time it is
  const showStatus = getShowStatus(selectedDate);

  useEffect(() => {
    const fetchPicks = async () => {
      // If it's a future show, don't even waste a database read!
      if (showStatus === 'FUTURE') {
        setPicks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const q = query(
          collection(db, "picks"), 
          where("date", "==", selectedDate)
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedPicks = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPicks(fetchedPicks);
      } catch (error) {
        console.error("Error fetching picks:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDate) {
      fetchPicks();
    }
  }, [selectedDate, showStatus]); 

  const actualSetlist = null; // Still null for now

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-20 text-emerald-400 font-bold animate-pulse">
        Loading Standings for {selectedDate}...
      </div>
    );
  }

  // NEW: The Empty State for Future Shows
  if (showStatus === 'FUTURE') {
    return (
      <div className="flex flex-col items-center justify-center mt-20 bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 text-center">
        <span className="text-5xl mb-4">⏳</span>
        <h3 className="text-xl font-black italic text-white mb-2">TOO EARLY</h3>
        <p className="text-slate-400 font-bold max-w-sm">
          No picks yet! The window to make picks for this show hasn't opened.
        </p>
      </div>
    );
  }

  // If we have no picks yet for the NEXT show
  if (picks.length === 0 && showStatus === 'NEXT') {
    return (
      <div className="flex flex-col items-center justify-center mt-20 bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 text-center">
        <span className="text-5xl mb-4">🎸</span>
        <h3 className="text-xl font-black italic text-white mb-2">NO PICKS YET</h3>
        <p className="text-slate-400 font-bold max-w-sm">
          Be the first to lock in your picks for tonight's show!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Leaderboard poolPicks={picks} actualSetlist={actualSetlist} />
    </div>
  );
}