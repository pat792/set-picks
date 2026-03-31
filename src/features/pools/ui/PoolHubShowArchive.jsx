import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { SHOW_DATES } from '../../../shared/data/showDates';
import { formatShowLabel, todayYmd } from '../../../shared';

export default function PoolHubShowArchive({ poolId }) {
  const pastShows = useMemo(() => {
    const today = todayYmd();
    return SHOW_DATES.filter((s) => s.date < today);
  }, []);

  return (
    <section>
      <h2 className="font-display text-display-sm font-bold uppercase tracking-wide text-white mb-4 px-1">
        Show archive
      </h2>
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
      {pastShows.length === 0 && (
        <p className="text-slate-500 font-bold text-sm px-1">
          No past shows in the schedule yet.
        </p>
      )}
    </section>
  );
}
