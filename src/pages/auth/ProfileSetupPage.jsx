import React from 'react';

import ProfileSetupForm from '../../features/auth/ui/ProfileSetupForm';
import { useProfileSetup } from '../../features/auth/model/useProfileSetup';

export default function ProfileSetupPage({ user }) {
  const {
    handle,
    setHandle,
    favoriteSong,
    setFavoriteSong,
    isSaving,
    error,
    saveProfile,
  } = useProfileSetup(user);

  return (
    <div className="min-h-screen w-full bg-indigo-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-800/50 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <h2 className="font-display text-display-xl md:text-display-xl-lg font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
          ALMOST THERE
        </h2>

        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">
          Complete your profile to enter the pool.
        </p>

        <ProfileSetupForm
          handle={handle}
          onHandleChange={setHandle}
          favoriteSong={favoriteSong}
          onFavoriteSongChange={setFavoriteSong}
          onSubmit={saveProfile}
          isSaving={isSaving}
          error={error}
        />
      </div>
    </div>
  );
}
