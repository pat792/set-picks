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
      <span className="font-semibold text-slate-300">Everyone</span>
      {' — all players for '}
      <span className="text-slate-300">{showLabel}</span>
      {'. '}
      <span className="text-slate-500">Use tabs to filter to a pool.</span>
    </>
  ) : (
    <>
      <span className="font-semibold text-slate-300">{poolName || 'This pool'}</span>
      {' — members only for '}
      <span className="text-slate-300">{showLabel}</span>
      {'. '}
      <span className="text-slate-500">Switch to Everyone for the full field.</span>
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
          How standings work
        </summary>
        <div className="border-t border-slate-700/40 px-3 py-3 text-sm leading-relaxed text-slate-400">
          {isEveryone ? (
            <p>
              <span className="font-semibold text-slate-200">Everyone</span> is the site-wide
              leaderboard: anyone who locked in picks for this show. To compare only the people in a
              crew you play with, pick that pool under{' '}
              <span className="font-semibold text-slate-300">Compare</span> below.
            </p>
          ) : (
            <p>
              This list shows only people in{' '}
              <span className="font-semibold text-slate-200">{poolName || 'this pool'}</span>. Open{' '}
              <span className="font-semibold text-slate-200">Pool home</span> to see who joined and
              share invites. Choose <span className="font-semibold text-slate-200">Everyone</span>{' '}
              to see rankings across the whole app for this show.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
