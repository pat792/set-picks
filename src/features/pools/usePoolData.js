import { useState, useEffect } from 'react';
import { doc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from '../../lib/firebase';

export function usePoolData(selectedDate) {
  const [poolPicks, setPoolPicks] = useState([]);
  const [actualSetlist, setActualSetlist] = useState(null);
  const [adminResults, setAdminResults] = useState({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" });

  useEffect(() => {
    if (!db) return;
    
    // 1. Listen for everyone's picks for this specific date
    const q = query(collection(db, "picks"), where("date", "==", selectedDate));
    const unsubscribePicks = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() }));
      setPoolPicks(fetched);
    });

    // 2. Listen for the official admin results for this specific date
    const unsubscribeResults = onSnapshot(doc(db, "results", selectedDate), (docSnap) => {
      if (docSnap.exists()) { 
        setActualSetlist(docSnap.data()); 
        setAdminResults(docSnap.data()); 
      } else { 
        setActualSetlist(null); 
        setAdminResults({ s1o: "", s1c: "", s2o: "", s2c: "", enc: "", wild: "" }); 
      }
    });

    // Cleanup listeners when the component unmounts or date changes
    return () => { 
      unsubscribePicks(); 
      unsubscribeResults(); 
    };
  }, [selectedDate]);

  return { poolPicks, actualSetlist, adminResults, setAdminResults };
}