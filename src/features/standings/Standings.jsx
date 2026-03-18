import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Leaderboard from '../../components/Leaderboard.jsx';

export default function Standings() {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPicks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "picks"));
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

    fetchPicks();
  }, []);

  const actualSetlist = null; // No show has happened yet!

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-20 text-emerald-400 font-bold animate-pulse">
        Loading Global Standings...
      </div>
    );
  }

  return (
    <div className="w-full">
      <Leaderboard poolPicks={picks} actualSetlist={actualSetlist} />
    </div>
  );
}