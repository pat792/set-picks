import React from 'react';
import { ChevronDown } from 'lucide-react';

import {
  SEASON_TOTALS_DESCRIPTION,
  SEASON_TOTALS_HEADING,
} from '../../../shared/config/dashboardVocabulary';
import PoolHubLeaderboard from './PoolHubLeaderboard';

/**
 * Season leaderboard with glossary in a collapsed <details> (mirrors Standings help pattern).
 */
export default function PoolHubSeasonTotalsSection({ members }) {
  return (
    <section>
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">
        {SEASON_TOTALS_HEADING}
      </h2>
      <PoolHubLeaderboard members={members} />
      <details className="group mt-3 rounded-xl border border-slate-700/50 bg-slate-900/25">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-400 [&::-webkit-details-marker]:hidden">
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
          About season totals
        </summary>
        <div className="border-t border-slate-700/40 px-3 py-3 text-xs font-medium text-slate-500 leading-relaxed">
          <p>{SEASON_TOTALS_DESCRIPTION}</p>
        </div>
      </details>
    </section>
  );
}
