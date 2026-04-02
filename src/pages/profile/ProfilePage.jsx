import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useSignOut } from '../../features/auth';
import { ProfileEditForm, useUserProfile } from '../../features/profile';
import Button from '../../shared/ui/Button';

export default function Profile({ user }) {
  const navigate = useNavigate();
  const signOut = useSignOut();
  const {
    handle,
    favoriteSong,
    joinDate,
    isLoading,
    isSaving,
    message,
    setHandle,
    setFavoriteSong,
    saveProfile,
  } = useUserProfile(user);

  const hasEmailPasswordProvider =
    user?.providerData?.some((p) => p.providerId === 'password') ?? false;

  const handleLogout = async () => {
    try {
      await signOut();
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

      <ProfileEditForm
        handle={handle}
        favoriteSong={favoriteSong}
        onHandleChange={setHandle}
        onFavoriteSongChange={setFavoriteSong}
        onSave={saveProfile}
        isSaving={isSaving}
        isLoading={isLoading}
        message={message}
      />

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
