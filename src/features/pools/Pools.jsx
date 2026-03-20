import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Pools({ user }) {
  const [userPools, setUserPools] = useState([]);
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
  
  const [joinCode, setJoinCode] = useState('');
  const [createName, setCreateName] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch the pools the user is currently a member of
  useEffect(() => {
    const fetchMyPools = async () => {
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
    fetchMyPools();
  }, [user]);

  // Utility to generate a random 5-character code (e.g., A7X9K)
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed lookalikes like O/0, I/1
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreatePool = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const inviteCode = generateInviteCode();
      const newPool = {
        name: createName.trim(),
        inviteCode: inviteCode,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'pools'), newPool);
      setUserPools([...userPools, { id: docRef.id, ...newPool }]);
      setCreateName('');
      setMessage({ text: `Pool created! Invite Code: ${inviteCode}`, type: 'success' });
    } catch (error) {
      console.error("Error creating pool:", error);
      setMessage({ text: 'Error creating pool.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinPool = async (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Find the pool with this code
      const q = query(collection(db, 'pools'), where('inviteCode', '==', code));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setMessage({ text: 'Invalid Invite Code.', type: 'error' });
        setIsLoading(false);
        return;
      }

      const poolDoc = snapshot.docs[0];
      const poolData = poolDoc.data();

      // Check if they are already in it
      if (poolData.members.includes(user.uid)) {
        setMessage({ text: 'You are already in this pool!', type: 'error' });
        setIsLoading(false);
        return;
      }

      // Add user to the pool
      await updateDoc(doc(db, 'pools', poolDoc.id), {
        members: arrayUnion(user.uid)
      });

      setUserPools([...userPools, { id: poolDoc.id, ...poolData, members: [...poolData.members, user.uid] }]);
      setJoinCode('');
      setMessage({ text: `Successfully joined ${poolData.name}! 🎸`, type: 'success' });
    } catch (error) {
      console.error("Error joining pool:", error);
      setMessage({ text: 'Error joining pool.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-4 pb-12">
      
      {/* SECTION 1: MY POOLS */}
      {/* HIDDEN ON MOBILE */}
      <h2 className="hidden md:block text-2xl font-black italic uppercase mb-4 text-white tracking-tight">
        Your Pools
      </h2>
      
      {userPools.length === 0 ? (
        <div className="bg-slate-800/30 border border-slate-700 border-dashed rounded-3xl p-8 text-center mb-8">
          <p className="text-slate-400 font-bold">You aren't in any pools yet.</p>
          <p className="text-sm text-slate-500 mt-1">Join a friend's pool or create your own below!</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {userPools.map(pool => (
            <div key={pool.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">{pool.name}</h3>
                <p className="text-xs text-slate-400 uppercase tracking-widest">{pool.members.length} Members</p>
              </div>
              <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-500 uppercase font-bold mr-2">Code:</span>
                <span className="text-emerald-400 font-mono font-black tracking-widest">{pool.inviteCode}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 2: JOIN OR CREATE */}
      <div className="bg-slate-800/50 rounded-3xl border border-slate-700/50 overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-700/50">
          <button 
            onClick={() => { setActiveTab('join'); setMessage({text:'', type:''}); }}
            className={`flex-1 py-4 font-black text-sm uppercase tracking-widest transition-colors ${activeTab === 'join' ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Join Pool
          </button>
          <button 
            onClick={() => { setActiveTab('create'); setMessage({text:'', type:''}); }}
            className={`flex-1 py-4 font-black text-sm uppercase tracking-widest transition-colors ${activeTab === 'create' ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Create Pool
          </button>
        </div>

        <div className="p-6">
          {message.text && (
            <div className={`mb-4 p-3 rounded-xl text-center font-bold text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {message.text}
            </div>
          )}

          {/* JOIN TAB */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinPool} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 block">Enter 5-Character Code</label>
                <input
                  type="text"
                  maxLength={5}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A7X9K"
                  className="bg-slate-900 border-2 border-slate-700 text-white font-black font-mono tracking-widest py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full uppercase text-center text-xl"
                />
              </div>
              <button disabled={isLoading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-lg py-4 rounded-xl uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50">
                {isLoading ? 'Joining...' : 'Join Pool'}
              </button>
            </form>
          )}

          {/* CREATE TAB */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreatePool} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 block">Pool Name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Denver Crew 2026"
                  className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full"
                />
              </div>
              <button disabled={isLoading} className="w-full bg-slate-100 hover:bg-white text-slate-900 font-black text-lg py-4 rounded-xl uppercase tracking-widest transition-all disabled:opacity-50">
                {isLoading ? 'Creating...' : 'Create New Pool'}
              </button>
            </form>
          )}
        </div>
      </div>

    </div>
  );
}