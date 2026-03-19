import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Leaderboard from '../../shared/components/Leaderboard';
import { useAuth } from '../auth/useAuth'; // NEW: To know who is logged in

import { getShowStatus } from '../../utils/timeLogic.js';

export default function Standings({ selectedDate }) {
  const { user } = useAuth(); // Get the current user
  
  const [allPicks, setAllPicks] = useState([]); // Stores EVERYONE'S picks
  const [userPools, setUserPools] = useState([]); // Stores the user's private groups
  const [activeFilter, setActiveFilter] = useState('global'); // 'global' or 'pool_id'
  
  const [loading, setLoading] = useState(true);
  const showStatus = getShowStatus(selectedDate);

  // 1. Fetch the User's Pools (So we know what tabs to show)
  useEffect(() => {
    const fetchPools = async () => {
      if (!user?.uid) return;
      try {
        const q = query(collection(db, 'pools'), where('members', 'array-contains', user.uid));
        const snapshot = await getDocs(q);
        const poolsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserPools(poolsData);
      } catch (error) {
        console.error("Error fetching pools:", error);
      }
    };
    fetchPools();
  }, [user]);

  // 2. Fetch ALL Picks for the Selected Date
  useEffect(() => {
    const fetchPicks = async () => {
      if (showStatus === 'FUTURE') {
        setAllPicks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const q = query(collection(db, "picks"), where("date", "==", selectedDate));
        const querySnapshot = await getDocs(q);
        const fetchedPicks = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAllPicks(fetchedPicks);
      } catch (error) {
        console.error("Error fetching picks:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDate) fetchPicks();
  }, [selectedDate, showStatus]); 

  // 3. IN-MEMORY FILTER: Instantly swap between Global and Pool views without DB reads!
  const displayedPicks = useMemo(() => {
    if (activeFilter === 'global') return allPicks;
    
    const selectedPool = userPools.find(p => p.id === activeFilter);
    if (!selectedPool) return allPicks;

    // Only return picks where the pick's userId is in this pool's member array
    return allPicks.filter(pick => selectedPool.members.includes(pick.userId));
  }, [allPicks, activeFilter, userPools]);

  const actualSetlist = null; // Still null for now

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-20 text-emerald-400 font-bold animate-pulse">
        Loading Standings for {selectedDate}...
      </div>
    );
  }

  // The Empty State for Future Shows
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

  return (
    <div className="w-full">
      
      {/* THE POOL FILTER TABS */}
      <div className="mb-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-3">
          Leaderboard Filter:
        </h3>
        
        {/* Horizontal Scrolling container for mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
          
          {/* Global Pill */}
          <button
            onClick={() => setActiveFilter('global')}
            className={`px-5 py-2.5 rounded-full font-black text-sm uppercase tracking-widest whitespace-nowrap transition-all shadow-lg ${
              activeFilter === 'global' 
                ? 'bg-emerald-500 text-slate-900 shadow-emerald-500/20' 
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Global
          </button>

          {/* User's Pools Pills */}
          {userPools.map(pool => (
            <button
              key={pool.id}
              onClick={() => setActiveFilter(pool.id)}
              className={`px-5 py-2.5 rounded-full font-black text-sm uppercase tracking-widest whitespace-nowrap transition-all shadow-lg ${
                activeFilter === pool.id 
                  ? 'bg-blue-500 text-white shadow-blue-500/20' 
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {pool.name}
            </button>
          ))}
        </div>
      </div>

      {/* THE LEADERBOARD */}
      {displayedPicks.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-12 bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 text-center">
          <span className="text-5xl mb-4">🎸</span>
          <h3 className="text-xl font-black italic text-white mb-2">NO PICKS YET</h3>
          <p className="text-slate-400 font-bold max-w-sm">
            {activeFilter === 'global' 
              ? "Be the first to lock in your picks for tonight's show!" 
              : `None of your friends in this pool have made picks yet!`}
          </p>
        </div>
      ) : (
        <Leaderboard poolPicks={displayedPicks} actualSetlist={actualSetlist} />
      )}
      
    </div>
  );
}