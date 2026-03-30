import React, { useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  writeBatch,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '../../shared/lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../shared/ui/Button';

export default function Profile({ user }) {
  const [handle, setHandle] = useState('');
  const [favoriteSong, setFavoriteSong] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const navigate = useNavigate();

  const hasEmailPasswordProvider =
    user?.providerData?.some((p) => p.providerId === 'password') ?? false;

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        const accountCreated = userDoc.exists() ? userDoc.data().createdAt : null;
        const creationTime = accountCreated?.toDate?.() || user?.metadata?.creationTime;

        if (creationTime) {
          const date = new Date(creationTime);
          const formattedDate = date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          });
          setJoinDate(formattedDate);
        }

        if (userDoc.exists()) {
          const data = userDoc.data();
          setHandle(data.handle || '');
          setFavoriteSong(data.favoriteSong || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
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
      const newHandle = handle.trim();
      const userPayload = {
        handle: newHandle,
        favoriteSong: favoriteSong.trim() || 'Unknown',
        updatedAt: new Date().toISOString(),
      };

      const picksQuery = query(
        collection(db, 'picks'),
        where('userId', '==', user.uid)
      );
      const picksSnapshot = await getDocs(picksQuery);

      let batch = writeBatch(db);
      let opCount = 0;

      batch.update(doc(db, 'users', user.uid), userPayload);
      opCount++;

      // Same as forEach(pick => batch.update(...)); use a loop so we can commit
      // before hitting Firestore’s 500 writes per batch limit.
      for (const pickDoc of picksSnapshot.docs) {
        if (opCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
        batch.update(pickDoc.ref, { handle: newHandle });
        opCount++;
      }

      await batch.commit();

      setMessage({ text: 'Profile updated successfully! 🎸', type: 'success' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ text: 'Error saving profile. Try again.', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-4 pb-12">
      <div className="mb-6 text-left">
        <h2 className="hidden md:block font-display text-display-page md:text-display-page-lg font-bold text-white">
          My Profile
        </h2>
        {joinDate && (
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1">
            Playing Since {joinDate}
          </p>
        )}
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-6 bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50"
      >
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

        <div className="pt-2">
          <Button
            variant="primary"
            type="submit"
            disabled={isSaving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-lg py-4 rounded-xl uppercase tracking-widest shadow-lg hover:shadow-emerald-500/20"
          >
            {isSaving ? 'Saving...' : 'Update Profile'}
          </Button>
        </div>

        {message.text && (
          <div
            className={`text-center font-bold text-sm mt-4 ${
              message.type === 'error' ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {message.text}
          </div>
        )}
      </form>

      {hasEmailPasswordProvider && user?.email && (
        <div className="mt-8 rounded-3xl border border-slate-700/50 bg-slate-800/50 p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
            Sign-in email &amp; password
          </h3>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Change your email or password</strong> for logging in
            (your sign-in user ID is your email). You&apos;ll need your current password, or you can
            request a reset link if you forgot it — all on the next screen.
          </p>
          <Link
            to="/dashboard/account-security"
            className="mt-4 flex w-full items-center justify-center rounded-xl border-2 border-slate-600 bg-slate-900/80 py-3.5 font-black text-sm uppercase tracking-widest text-white transition-colors hover:border-emerald-500/50 hover:bg-slate-800"
          >
            Change email or password
          </Link>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-700/50">
        <Button
          variant="text"
          onClick={handleLogout}
          type="button"
          className="w-full bg-transparent hover:bg-red-500/10 border-2 border-red-500/30 hover:border-red-500 text-red-400 text-sm py-4 rounded-xl uppercase tracking-widest"
        >
          Log Out
        </Button>
      </div>
    </div>
  );
}
