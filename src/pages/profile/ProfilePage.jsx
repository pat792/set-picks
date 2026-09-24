import React, { useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

import { useFeatureSpotlight } from '../../features/feature-discovery';
import {
  BadgeShelf,
  ProfileEditForm,
  useUserProfile,
} from '../../features/profile';
import { STATS_CLUSTER_PATHS } from '../../shared/config/dashboardRoutes';
import { VIEW_PERSONAL_STATS_LINK } from '../../shared/config/dashboardVocabulary';
import DashboardActionRow from '../../shared/ui/DashboardActionRow';
import DashboardRowPill from '../../shared/ui/DashboardRowPill';

/**
 * Account cluster — identity surface (handle, favorite song, avatar, badges).
 */
export default function ProfilePage({ user: userProp }) {
  const outlet = useOutletContext();
  const user = userProp ?? outlet?.user;
  const identitySpotlight = useFeatureSpotlight('profile-identity');

  const {
    handle,
    favoriteSong,
    avatarId,
    badges,
    joinDate,
    isLoading,
    isSaving,
    message,
    setHandle,
    setFavoriteSong,
    setAvatarId,
    saveProfile,
  } = useUserProfile(user);

  const onAvatarChange = useCallback(
    (nextId) => {
      setAvatarId(nextId);
      if (identitySpotlight.active) {
        identitySpotlight.trackClick();
        identitySpotlight.markSeen();
      }
    },
    [setAvatarId, identitySpotlight],
  );

  return (
    <div>
      <DashboardActionRow
        hint="These settings control how you appear on your public profile (/user/…) and anywhere badges or avatars show."
        hintLabel="public profile appearance"
      >
        {user?.uid ? (
          <Link
            to={`/user/${user.uid}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-brand-primary/50 bg-brand-primary/15 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-brand-primary transition-colors hover:border-brand-primary hover:bg-brand-primary/25"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
            View public profile
          </Link>
        ) : null}
        <DashboardRowPill as={Link} to={STATS_CLUSTER_PATHS.personal} tone="muted">
          {VIEW_PERSONAL_STATS_LINK}
        </DashboardRowPill>
      </DashboardActionRow>

      {joinDate ? (
        <p className="mb-6 text-xs font-bold uppercase tracking-widest text-brand-primary">
          Playing Since {joinDate}
        </p>
      ) : null}

      {!isLoading ? (
        <BadgeShelf
          badges={badges}
          surface="profile"
          showNewBadge={identitySpotlight.active}
        />
      ) : null}

      <div className="mt-6">
        <ProfileEditForm
          handle={handle}
          favoriteSong={favoriteSong}
          avatarId={avatarId}
          onHandleChange={setHandle}
          onFavoriteSongChange={setFavoriteSong}
          onAvatarChange={onAvatarChange}
          onSave={saveProfile}
          isSaving={isSaving}
          isLoading={isLoading}
          message={message}
          showAvatarNewBadge={identitySpotlight.active}
        />
      </div>
    </div>
  );
}
