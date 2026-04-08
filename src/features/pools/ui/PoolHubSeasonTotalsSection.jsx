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
}) {
  return (
    <section>
      <h2 className="mb-3 ml-1 text-xs font-bold uppercase tracking-widest text-content-secondary">
        {SEASON_TOTALS_HEADING}
      </h2>
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border-subtle bg-surface-panel py-10 font-bold text-content-secondary shadow-inset-glass">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" aria-hidden />
          <span>Loading season totals…</span>
        </div>
      ) : (
        <PoolHubLeaderboard members={members} />
      )}
      <details className="group mt-3 rounded-xl border border-border-subtle bg-surface-glass shadow-inset-glass">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-bold text-content-secondary transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
          About season totals
        </summary>
        <div className="space-y-2 border-t border-border-muted px-3 py-3 text-xs font-medium leading-relaxed text-content-secondary">
          <p>{SEASON_TOTALS_DESCRIPTION}</p>
          <p>
            <span className="text-white/90">Shows</span> is how many nights you submitted picks in
            this pool after that show was finalized (Finalize and rollup). Nights you skip do not add
            to your count.
          </p>
        </div>
      </details>
    </section>
  );
}
