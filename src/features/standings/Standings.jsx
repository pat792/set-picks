import React, { useState, useEffect } from 'react';
// NEW: We imported 'query' and 'where' to filter the database!
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Leaderboard from '../../components/Leaderboard.jsx';

// NEW: It now accepts 'selectedDate' as a prop from the layout
export default function Standings({ selectedDate }) {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPicks = async () => {
      setLoading(true); // Restart loading spinner when date changes
      try {
        // NEW: The smart query! Only fetch picks for the selected date.
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
  }, [selectedDate]); // Re-run this exact function any time the date changes!

  const actualSetlist = null; // Still null for now

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-20 text-emerald-400 font-bold animate-pulse">
        Loading Standings for {selectedDate}...
      </div>
    );
  }

  return (
    <div className="w-full">
      <Leaderboard poolPicks={picks} actualSetlist={actualSetlist} />
    </div>
  );
}