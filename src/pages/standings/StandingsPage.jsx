import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../shared/lib/firebase';
import Leaderboard from '../../features/scoring/Leaderboard';
import { useAuth } from '../../features/auth/useAuth';
import { getShowStatus } from '../../shared/utils/timeLogic.js';
import Button from '../../shared/ui/Button';
import Card from '../../shared/ui/Card';
import PageTitle from '../../shared/ui/PageTitle';
import { Loader2, Inbox, Music, Scale } from 'lucide-react';

export default function Standings({ selectedDate }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const poolIdFromUrl = searchParams.get('poolId')?.trim() || '';

  const selectGlobalFilter = () => {
    setActiveFilter('global');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('poolId');
        return next;
      },
      { replace: true }
    );
  };

  const selectPoolFilter = (poolId) => {
    setActiveFilter(poolId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('poolId', poolId);
        return next;
      },
      { replace: true }
    );
  };

  const [allPicks, setAllPicks] = useState([]);
  const [userPools, setUserPools] = useState([]);
  const [activeFilter, setActiveFilter] = useState('global');
  const [actualSetlist, setActualSetlist] = useState(null); 
  
  const [loading, setLoading] = useState(true);
  const showStatus = getShowStatus(selectedDate);

  // 1. Fetch the User's Pools 
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

  // Deep-link: ?poolId=<id> selects that pool tab once it’s a member pool.
  useEffect(() => {
    if (!poolIdFromUrl) return;
    if (!userPools.some((p) => p.id === poolIdFromUrl)) return;
    setActiveFilter(poolIdFromUrl);
  }, [poolIdFromUrl, userPools]);

  // 2. Fetch ALL Picks AND the Official Setlist for the Selected Date
  useEffect(() => {
    const fetchData = async () => {
      if (showStatus === 'FUTURE') {
        setAllPicks([]);
        setActualSetlist(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // A. Fetch the Picks
        // CHANGED: Query by our new schema field 'showDate' instead of 'date'
        const q = query(collection(db, "picks"), where("showDate", "==", selectedDate));
        const querySnapshot = await getDocs(q);
        const fetchedPicks = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllPicks(fetchedPicks);

        // B. Fetch the Official Setlist (Saved by Admin)
        const setlistRef = doc(db, 'official_setlists', selectedDate);
        const setlistSnap = await getDoc(setlistRef);
        
        if (setlistSnap.exists()) {
          const data = setlistSnap.data();
          setActualSetlist({
            ...(data.setlist || {}),
            officialSetlist: Array.isArray(data.officialSetlist) ? data.officialSetlist : [],
          });
        } else {
          setActualSetlist(null); // No official setlist yet
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDate) fetchData();
  }, [selectedDate, showStatus]); 

  // 3. IN-MEMORY FILTER: Instantly swap between Global and Pool views
  const displayedPicks = useMemo(() => {
    if (activeFilter === 'global') return allPicks;
    
    const selectedPool = userPools.find(p => p.id === activeFilter);
    if (!selectedPool) return allPicks;

    return allPicks.filter(pick => selectedPool.members.includes(pick.userId));
  }, [allPicks, activeFilter, userPools]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 mt-20 text-emerald-400 font-bold">
        <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
        <p>Loading Standings for {selectedDate}...</p>
      </div>
    );
  }

  // FUTURE: "Too early" copy is universal in DashboardLayout (TooEarlyBanner).
  if (showStatus === 'FUTURE') {
    return null;
    
  }

  return (
    <div className="w-full">
      <div className="flex justify-end px-2 mb-4">
        <Link
          to="/dashboard/scoring"
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 hover:underline underline-offset-2"
        >
          <Scale className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Scoring rules
        </Link>
      </div>

      {/* THE POOL FILTER TABS */}
      <div className="mb-6">
        <PageTitle as="h3" variant="eyebrow" className="px-2 mb-3">
          Leaderboard Filter:
        </PageTitle>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
          <Button
            variant="text"
            onClick={selectGlobalFilter}
            className={`px-5 py-2.5 rounded-full font-black text-sm uppercase tracking-widest whitespace-nowrap transition-all shadow-lg ${
              activeFilter === 'global' 
                ? 'bg-emerald-500 text-slate-900 shadow-emerald-500/20' 
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Global
          </Button>

          {userPools.map(pool => (
            <Button
              variant="text"
              key={pool.id}
              onClick={() => selectPoolFilter(pool.id)}
              className={`px-5 py-2.5 rounded-full font-black text-sm uppercase tracking-widest whitespace-nowrap transition-all shadow-lg ${
                activeFilter === pool.id 
                  ? 'bg-blue-500 text-white shadow-blue-500/20' 
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {pool.name}
            </Button>
          ))}
        </div>
      </div>

      {/* ALERT BANNER: Shows if the game is locked but Admin hasn't saved the setlist yet */}
      {!actualSetlist && allPicks.length > 0 && (
        <Card variant="alert" padding="sm" className="mb-6 text-center">
          <p className="text-amber-400 font-bold text-sm">
            Waiting for official setlist. Stay tuned...
          </p>
        </Card>
      )}

      {/* THE LEADERBOARD */}
      {displayedPicks.length === 0 ? (
        <Card
          variant="default"
          padding="lg"
          className="mt-12 flex flex-col items-center justify-center text-center"
        >
          {showStatus === 'PAST' ? (
            <>
              <Inbox className="mb-4 h-14 w-14 text-slate-500" strokeWidth={1.5} aria-hidden />
              <PageTitle as="h3" variant="section" className="mb-2">
                No picks for this show
              </PageTitle>
              <p className="text-slate-400 font-bold max-w-sm">
                {activeFilter === 'global'
                  ? 'Nobody submitted picks for this date.'
                  : 'None of your friends in this pool submitted picks for this date.'}
              </p>
            </>
          ) : (
            <>
              <Music className="mb-4 h-14 w-14 text-emerald-400/80" strokeWidth={1.5} aria-hidden />
              <PageTitle as="h3" variant="section" className="mb-2">
                NO PICKS YET
              </PageTitle>
              <p className="text-slate-400 font-bold max-w-sm">
                {activeFilter === 'global'
                  ? "Be the first to lock in your picks for tonight's show!"
                  : 'None of your friends in this pool have made picks yet!'}
              </p>
            </>
          )}
        </Card>
      ) : (
        <Leaderboard poolPicks={displayedPicks} actualSetlist={actualSetlist} />
      )}
      
    </div>
  );
}