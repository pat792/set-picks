import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

import { ProfileEditForm, useUserProfile } from '../../features/profile';
import { dashboardPageTitleGradientClasses } from '../../shared/config/dashboardHeadingTypography';
import DashboardActionRow from '../../shared/ui/DashboardActionRow';
import DashboardRowPill from '../../shared/ui/DashboardRowPill';

/**
 * Profile cluster — identity surface (handle, favorite song, public preview, join date).
 */
export default function ProfilePage({ user: userProp }) {
  const outlet = useOutletContext();
  const user = userProp ?? outlet?.user;

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

  return (
    <div>
      <DashboardActionRow>
        {user?.uid ? (
          <DashboardRowPill as={Link} to={`/user/${user.uid}`} tone="muted">
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Preview public view
          </DashboardRowPill>
        ) : null}
      </DashboardActionRow>

      <div className="mb-6 text-left">
        <h2
          className={`hidden md:block font-display text-display-page md:text-display-page-lg font-bold ${dashboardPageTitleGradientClasses}`}
        >
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
    </div>
  );
}
