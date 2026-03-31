import React from 'react';
import { Link, useParams } from 'react-router-dom';

import { usePublicProfile } from '../../features/profile/model/usePublicProfile';
import PublicProfileView from '../../features/profile/ui/PublicProfileView';

export default function PublicProfile() {
  const { userId } = useParams();
  const { loading, error, profile, userPools } = usePublicProfile(userId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6">
        <p className="text-emerald-400 font-bold animate-pulse">Loading profile…</p>
        <Link to="/" className="mt-8 text-sm text-slate-500 hover:text-slate-300">
          ← Home
        </Link>
      </div>
    );
  }

  if (error === 'fetch') {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="font-display text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-slate-400 text-sm mb-8">Could not load this profile.</p>
        <Link to="/" className="text-emerald-400 font-bold hover:underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  if (error === 'missing' || error === 'notfound' || !profile) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="font-display text-2xl font-bold text-white mb-2">Player not found</h1>
        <p className="text-slate-400 text-sm max-w-md mb-8">
          {error === 'missing'
            ? 'No user id was provided.'
            : 'There is no public profile for this link.'}
        </p>
        <Link
          to="/"
          className="text-emerald-400 font-bold hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  return <PublicProfileView profile={profile} userPools={userPools} />;
}
