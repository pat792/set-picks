import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

import { SHOW_DATES } from '../../../shared/data/showDates';
import { formatShowLabel, todayYmd } from '../../../shared';

export default function PoolHubShowArchive({ poolId }) {
  const pastShows = useMemo(() => {
    const today = todayYmd();
    return SHOW_DATES.filter((s) => s.date < today);
  }, []);

  return (
    <section>
      <details className="group rounded-xl border border-slate-700/50 bg-slate-900/25">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-400 [&::-webkit-details-marker]:hidden">
          <span className="uppercase tracking-widest">Past shows</span>
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="space-y-2 border-t border-slate-700/40 px-3 py-3">
          {pastShows.length > 0 ? (
            <ul className="space-y-2">
              {pastShows.map((show) => (
                <li key={show.date}>
                  <Link
                    to={`/dashboard/standings?showDate=${encodeURIComponent(show.date)}&poolId=${encodeURIComponent(poolId)}`}
                    className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Show standings · {formatShowLabel(show.date)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 font-bold text-sm px-1">
              No past shows in the schedule yet.
            </p>
          )}
        </div>
      </details>
    </section>
  );
}
