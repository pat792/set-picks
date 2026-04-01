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
      <details className="group">
        <summary className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1 cursor-pointer list-none flex items-center justify-between">
          SHOW ARCHIVE{' '}
          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-2 mt-3">
          {pastShows.length > 0 ? (
            <ul className="space-y-2">
              {pastShows.map((show) => (
                <li key={show.date}>
                  <Link
                    to={`/dashboard/standings?showDate=${encodeURIComponent(show.date)}&poolId=${encodeURIComponent(poolId)}`}
                    className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    View Standings for {formatShowLabel(show.date)}
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
