import React from 'react';
import { useParams } from 'react-router-dom';

import { PublicProfileView, usePublicProfile } from '../../features/profile';
import { AsyncStatus } from '../../shared';
import BackButton from '../../shared/ui/BackButton';

export default function PublicProfile() {
  const { userId } = useParams();
  const { loading, error, profile, userPools } = usePublicProfile(userId);

  if (loading || error === 'fetch') {
    return (
      <div className="min-h-screen bg-indigo-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AsyncStatus
          isLoading={loading}
          error={error === 'fetch' ? 'Could not load this profile.' : null}
          loadingText="Loading profile…"
        />
        <BackButton className="mt-8" />
      </div>
    );
  }

  if (error === 'missing' || error === 'notfound' || !profile) {
    return (
      <div className="min-h-screen bg-indigo-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="font-display text-2xl font-bold text-white mb-2">Player not found</h1>
        <p className="text-slate-400 text-sm max-w-md mb-8">
          {error === 'missing'
            ? 'No user id was provided.'
            : 'There is no public profile for this link.'}
        </p>
        <BackButton />
      </div>
    );
  }

  return <PublicProfileView profile={profile} userPools={userPools} />;
}
