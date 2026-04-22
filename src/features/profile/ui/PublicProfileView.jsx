import React from 'react';
import { Loader2 } from 'lucide-react';

import { formatMonthYear } from '../../../shared';
import BackButton from '../../../shared/ui/BackButton';

function formatPlayingSince(createdAt) {
  const value = formatMonthYear(createdAt);
  return value || null;
}

function StatCell({ label, value, loading }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-field p-4">
      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-content-secondary">
        {label}
      </p>
      {loading ? (
        <Loader2
          className="mx-auto h-5 w-5 animate-spin text-brand-primary"
          aria-label={`Loading ${label.toLowerCase()}`}
        />
      ) : (
        <p className="text-xl font-black tabular-nums text-brand-primary">
          {value}
        </p>
      )}
    </div>
  );
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

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-xl mx-auto px-4 py-10 pb-16">
        <BackButton className="mb-8" />

        <header className="mb-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500">
            {handle}
          </h1>
          {playingSince && (
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-brand-primary">
              Playing since {playingSince}
            </p>
          )}
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
            <p className="text-sm font-bold text-content-secondary">Not in any pools</p>
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
          <div className="grid grid-cols-3 gap-3 text-center">
            <StatCell
              label="Total points"
              value={totalPoints}
              loading={statsLoading}
            />
            <StatCell label="Wins" value={wins} loading={statsLoading} />
            <StatCell label="Shows" value={shows} loading={statsLoading} />
          </div>
          <p className="mt-3 text-[11px] font-medium leading-relaxed text-content-secondary">
            Running totals across every graded night. Wins count shows where
            this player had the top score overall, not just in a single pool.
          </p>
        </section>
      </div>
    </div>
  );
}
