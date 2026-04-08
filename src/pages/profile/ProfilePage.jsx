import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

import { useSignOut } from '../../features/auth';
import { ProfileEditForm, useUserProfile } from '../../features/profile';
import Button from '../../shared/ui/Button';
import DashboardActionRow from '../../shared/ui/DashboardActionRow';
import DashboardRowPill from '../../shared/ui/DashboardRowPill';

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
    <div className="max-w-xl mx-auto pb-6 md:pb-12">
      <DashboardActionRow>
        {user?.uid ? (
          <DashboardRowPill as={Link} to={`/user/${user.uid}`} tone="muted">
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Preview public view
          </DashboardRowPill>
        ) : null}
      </DashboardActionRow>

      <div className="mb-6 text-left">
        <h2 className="hidden md:block font-display text-display-page md:text-display-page-lg font-bold text-white">
          Profile
        </h2>
        {joinDate && (
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-brand-primary">
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
        <div className="mt-8 rounded-3xl border border-border-subtle bg-surface-panel p-6 shadow-inset-glass">
          <h3 className="text-sm font-black uppercase tracking-widest text-content-secondary">
            Sign-in &amp; password
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-content-secondary">
            Update the email or password you use to sign in (you&apos;ll need your current password on
            the next screen, or a reset link if you forgot it).
          </p>
          <Link
            to="/dashboard/account-security"
            className="mt-4 flex w-full items-center justify-center rounded-xl border-2 border-border-subtle bg-surface-field py-3.5 text-sm font-black uppercase tracking-widest text-white transition-colors hover:border-brand-primary/50 hover:bg-surface-panel"
          >
            Update email or password
          </Link>
        </div>
      )}

      <div className="mt-8 border-t border-border-muted pt-6">
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
