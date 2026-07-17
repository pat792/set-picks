import React from 'react';
import { Loader2 } from 'lucide-react';

import { formatMonthYear } from '../../../shared';
import BackButton from '../../../shared/ui/BackButton';
import {
  computeAvgCorrectPicksPerShow,
  computeAvgPointsPerShow,
  formatAvgCorrectPicksPerShow,
  formatAvgPointsPerShow,
} from '../model/profileAverages';
import ProfileAvatar from './ProfileAvatar';

function formatPlayingSince(createdAt) {
  const value = formatMonthYear(createdAt);
  return value || null;
}

/**
 * Read-only public profile: handle, favorite song, pools, and season stats.
 * Stats are the global cross-pool view (points from the user's own graded
 * picks, overall shows won, and shows played) — `wins` counts each night
 * once based on the global high score, not per-pool.
 */
export default function PublicProfileView({
  profile,
  userPools = [],
  stats,
  statsLoading = false,
}) {
  if (!profile) return null;

  const handle = profile.handle?.trim() || 'Anonymous';
  const playingSince = formatPlayingSince(profile.createdAt);
  const favoriteSong =
    profile.favoriteSong &&
    String(profile.favoriteSong).trim() !== '' &&
    profile.favoriteSong !== 'Unknown'
      ? profile.favoriteSong
      : null;

  const totalPoints =
    typeof stats?.totalPoints === 'number' ? stats.totalPoints : 0;
  const wins = typeof stats?.wins === 'number' ? stats.wins : 0;
  const shows = typeof stats?.shows === 'number' ? stats.shows : 0;
  const avgPointsDisplay = formatAvgPointsPerShow(
    computeAvgPointsPerShow(stats)
  );
  const avgCorrectDisplay = formatAvgCorrectPicksPerShow(
    computeAvgCorrectPicksPerShow(stats)
  );

  const statColumns = [
    { key: 'points', label: 'Total points', value: totalPoints },
    { key: 'avg', label: 'Avg pts / show', value: avgPointsDisplay },
    {
      key: 'avgCorrect',
      label: 'Avg correct / show',
      value: avgCorrectDisplay,
    },
    { key: 'wins', label: 'Wins', value: wins },
    { key: 'shows', label: 'Shows', value: shows },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-xl mx-auto px-4 py-10 pb-16">
        <BackButton className="mb-8" />

        <header className="mb-2 flex items-start gap-4">
          <ProfileAvatar
            avatarId={profile.avatarId}
            size="lg"
            alt={`${handle}'s avatar`}
          />
          <div className="min-w-0">
            <h1 className="font-display text-3xl sm:text-4xl font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500">
              {handle}
            </h1>
            {playingSince && (
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-brand-primary">
                Playing since {playingSince}
              </p>
            )}
          </div>
        </header>

        <section className="mt-8 rounded-3xl border border-border-subtle bg-surface-panel p-6 shadow-inset-glass">
          <h2 className="mb-2 text-xs font-black uppercase tracking-widest text-content-secondary">
            Favorite song
          </h2>
          <p className="text-lg font-bold text-white">
            {favoriteSong || 'Not chosen yet'}
          </p>
        </section>

        <section className="mt-6 rounded-3xl border border-border-subtle bg-surface-panel p-6 shadow-inset-glass">
          <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-content-secondary">
            Active pools
          </h2>
          {userPools.length === 0 ? (
            <p className="text-sm font-bold text-content-secondary">
              Not in any pools
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {userPools.map((pool) => (
                <span
                  key={pool.id}
                  className="inline-flex items-center rounded-full border border-border-subtle bg-surface-panel-strong px-3 py-1 text-xs font-bold text-brand-primary"
                >
                  {pool.name || 'Unnamed pool'}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-border-subtle bg-surface-panel p-6 shadow-inset-glass">
          <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-content-secondary">
            Stats
          </h2>
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
            {statColumns.map(({ key, label, value }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <p className="flex flex-1 items-end justify-center px-0.5 text-[10px] font-black uppercase leading-snug tracking-wider text-content-secondary">
                  {label}
                </p>
                <div className="flex min-h-[3.25rem] items-center justify-center rounded-2xl border border-border-subtle bg-surface-field px-2 py-3">
                  {statsLoading ? (
                    <Loader2
                      className="h-5 w-5 shrink-0 animate-spin text-brand-primary"
                      aria-label={`Loading ${label}`}
                    />
                  ) : (
                    <span className="text-2xl font-black tabular-nums leading-none tracking-tight text-brand-primary">
                      {value}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] font-medium leading-relaxed text-content-secondary">
            Running totals across every graded night. Avg pts / show is total
            points divided by shows played. Avg correct / show is correct
            slots per show (6 slots) when the career rollup is present;
            otherwise —. Wins count nights with the overall top score, not
            just in a single pool.
          </p>
        </section>
      </div>
    </div>
  );
}
