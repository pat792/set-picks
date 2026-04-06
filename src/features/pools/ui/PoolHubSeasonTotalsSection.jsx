import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

import {
  SEASON_TOTALS_DESCRIPTION,
  SEASON_TOTALS_HEADING,
} from '../../../shared/config/dashboardVocabulary';
import PoolHubLeaderboard from './PoolHubLeaderboard';

/**
 * Season leaderboard with glossary in a collapsed <details> (mirrors Standings help pattern).
 */
export default function PoolHubSeasonTotalsSection({
  members,
  loading = false,
  seasonShowCount,
}) {
  return (
    <section>
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">
        {SEASON_TOTALS_HEADING}
      </h2>
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-800/40 py-10 text-slate-500 font-bold">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" aria-hidden />
          <span>Loading season totals…</span>
        </div>
      ) : (
        <PoolHubLeaderboard members={members} seasonShowCount={seasonShowCount} />
      )}
      <details className="group mt-3 rounded-xl border border-slate-700/50 bg-slate-900/25">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-400 [&::-webkit-details-marker]:hidden">
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
          About season totals
        </summary>
        <div className="border-t border-slate-700/40 px-3 py-3 text-xs font-medium text-slate-500 leading-relaxed space-y-2">
          <p>{SEASON_TOTALS_DESCRIPTION}</p>
          <p>
            <span className="text-slate-400">Shows</span> counts graded nights where
            you had picks in this pool, out of past dates on the tour schedule (nights you sat out are
            not counted against you).
          </p>
        </div>
      </details>
    </section>
  );
}
