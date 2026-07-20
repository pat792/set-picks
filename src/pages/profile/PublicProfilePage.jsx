import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import {
  PublicProfileView,
  usePublicProfile,
  useUserSeasonStats,
} from '../../features/profile';
import { ShowCalendarProvider } from '../../features/show-calendar';
import { AsyncStatus } from '../../shared';
import BackButton from '../../shared/ui/BackButton';

function PublicProfileContent() {
  const { userId } = useParams();
  const { loading, error, profile, userPools } = usePublicProfile(userId);
  const { stats, loading: statsLoading } = useUserSeasonStats(
    profile ? userId : undefined
  );

  if (loading || error === 'fetch') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-6 text-center text-white">
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-6 text-center text-white">
        <h1 className="font-display text-2xl font-bold text-white mb-2">Player not found</h1>
        <p className="mb-8 max-w-md text-sm text-content-secondary">
          {error === 'missing'
            ? 'No user id was provided.'
            : 'There is no public profile for this link.'}
        </p>
        <BackButton />
      </div>
    );
  }

  return (
    <PublicProfileView
      profile={profile}
      userPools={userPools}
      stats={stats}
      statsLoading={statsLoading}
    />
  );
}

/**
 * Public player profiles stay shareable (`follow`) but are not ranking targets
 * (`noindex`) — thin/PII risk until a richer public player-card bar exists (#661).
 */
export default function PublicProfile() {
  // Season stats need the show calendar; the public profile route lives
  // outside the dashboard shell so we provide it locally.
  return (
    <ShowCalendarProvider>
      <Helmet>
        <meta name="robots" content="noindex,follow" />
      </Helmet>
      <PublicProfileContent />
    </ShowCalendarProvider>
  );
}
