import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Scale, Users } from 'lucide-react';

import GhostPill from '../../../shared/ui/GhostPill';

/**
 * Explains whether standings are site-wide or pool-scoped, and surfaces primary actions.
 */
export default function StandingsScopeIntro({
  activeFilter,
  poolName,
  showLabel,
  onOpenPoolHub,
  onOpenScoringRules,
}) {
  const isEveryone = activeFilter === 'global';

  return (
    <section
      className="mb-5 rounded-2xl border border-slate-700/70 bg-slate-800/40 px-4 py-4 md:px-5"
      aria-labelledby="standings-scope-heading"
    >
      <h2
        id="standings-scope-heading"
        className="font-display text-sm font-bold uppercase tracking-widest text-slate-400"
      >
        What you&apos;re viewing
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        {isEveryone ? (
          <>
            <span className="font-semibold text-white">Everyone</span> means all players who
            locked in picks for{' '}
            <span className="font-semibold text-white">{showLabel}</span> — your overall site
            leaderboard. Use the tabs below to narrow results to a pool you&apos;ve joined.
          </>
        ) : (
          <>
            Only members of{' '}
            <span className="font-semibold text-white">{poolName || 'this pool'}</span> appear
            here. Choose <span className="font-semibold text-slate-200">Everyone</span> above to
            see how the whole field stacks up for {showLabel}.
          </>
        )}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          to="/dashboard/pools"
          className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900/60 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-400 transition-colors hover:border-emerald-500/50 hover:bg-slate-800 hover:text-emerald-300"
        >
          <Users className="h-4 w-4 shrink-0" aria-hidden />
          My pools
        </Link>
        {!isEveryone && onOpenPoolHub ? (
          <GhostPill type="button" icon={Home} onClick={onOpenPoolHub}>
            Pool home
          </GhostPill>
        ) : null}
        {onOpenScoringRules ? (
          <GhostPill type="button" icon={Scale} onClick={onOpenScoringRules}>
            Scoring rules
          </GhostPill>
        ) : null}
      </div>
    </section>
  );
}
