import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Home, Scale, Users } from 'lucide-react';

import DashboardActionRow from '../../../shared/ui/DashboardActionRow';
import GhostPill from '../../../shared/ui/GhostPill';

/**
 * Compact standings header: one-line scope + actions; long explanation in a collapsed <details>.
 */
export default function StandingsScopeIntro({
  activeFilter,
  poolName,
  showLabel,
  onOpenPoolHub,
  onOpenScoringRules,
}) {
  const isEveryone = activeFilter === 'global';

  const summaryLine = isEveryone ? (
    <>
      <span className="font-semibold text-slate-300">Show standings</span>
      {' · '}
      <span className="text-slate-300">{showLabel}</span>
      {' · '}
      <span className="font-semibold text-slate-300">Everyone</span>
      <span className="text-slate-500"> — all players who picked this show. Use Compare for one pool.</span>
    </>
  ) : (
    <>
      <span className="font-semibold text-slate-300">Show standings</span>
      {' · '}
      <span className="text-slate-300">{showLabel}</span>
      {' · '}
      <span className="font-semibold text-slate-300">{poolName || 'This pool'}</span>
      <span className="text-slate-500"> — pool members only. Everyone tab = full field.</span>
    </>
  );

  return (
    <div className="mb-4 space-y-2">
      <DashboardActionRow summary={summaryLine}>
        <Link
          to="/dashboard/pools"
          className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 transition-colors hover:border-emerald-500/50 hover:bg-slate-800 hover:text-emerald-300 sm:px-4"
        >
          <Users className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
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
      </DashboardActionRow>

      <details className="group rounded-xl border border-slate-700/50 bg-slate-900/25">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-400 [&::-webkit-details-marker]:hidden">
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
          About show standings
        </summary>
        <div className="border-t border-slate-700/40 px-3 py-3 text-sm leading-relaxed text-slate-400">
          {isEveryone ? (
            <p>
              <span className="font-semibold text-slate-200">Show standings</span> are the running
              order of points for <span className="font-semibold text-slate-300">one night</span>{' '}
              only — everyone who locked picks for that date. To see the same night scoped to a
              crew, pick a pool under <span className="font-semibold text-slate-300">Compare</span>.
              (Pool Hub has <span className="font-semibold text-slate-300">season totals</span>{' '}
              across many nights — different from this screen.)
            </p>
          ) : (
            <p>
              This is <span className="font-semibold text-slate-200">show standings</span> for one
              night, limited to{' '}
              <span className="font-semibold text-slate-200">{poolName || 'this pool'}</span>. Open{' '}
              <span className="font-semibold text-slate-200">Pool home</span> for invites and roster;{' '}
              <span className="font-semibold text-slate-200">Season totals</span> there sum points
              across every graded show in the pool.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
