import React from 'react';
import { formatMonthYear } from '../../../shared';
import BackButton from '../../../shared/ui/BackButton';

function formatPlayingSince(createdAt) {
  const value = formatMonthYear(createdAt);
  return value || null;
}

/**
 * Read-only public profile: handle, favorite song, pools, and stats.
 */
export default function PublicProfileView({ profile, userPools = [] }) {
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
    typeof profile.totalPoints === 'number' ? profile.totalPoints : 0;

  return (
    <div className="min-h-screen bg-brand-bg text-white">
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
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            Favorite song
          </h2>
          <p className="text-lg font-bold text-white">
            {favoriteSong || 'Not chosen yet'}
          </p>
        </section>

        <section className="mt-6 rounded-3xl border border-border-subtle bg-surface-panel p-6 shadow-inset-glass">
          <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
            Active pools
          </h2>
          {userPools.length === 0 ? (
            <p className="text-sm font-bold text-slate-500">Not in any pools</p>
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
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            Stats
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-border-subtle bg-surface-field p-4">
              <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Total points
              </p>
              <p className="text-xl font-black tabular-nums text-brand-primary">{totalPoints}</p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-surface-field p-4">
              <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Shows played
              </p>
              <p className="text-xl font-black tabular-nums text-slate-400">TBD</p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-surface-field p-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Direct hits
              </p>
              <p className="text-xl font-black text-slate-400 tabular-nums">TBD</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
