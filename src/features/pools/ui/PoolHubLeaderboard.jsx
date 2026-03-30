import React from 'react';
import { Link } from 'react-router-dom';

export default function PoolHubLeaderboard({ members }) {
  return (
    <section>
      <h2 className="font-display text-display-sm font-bold uppercase tracking-wide text-white mb-4 px-1">
        All-time leaderboard
      </h2>
      {members.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-500 font-bold">
          No members to show yet.
        </div>
      ) : (
        <ul className="space-y-2">
        {members.map((m, index) => {
          const rank = index + 1;
          const handle = m.handle || 'Anonymous';
          const pts =
            typeof m.totalPoints === 'number' ? m.totalPoints : 0;
          const played =
            typeof m.showsPlayed === 'number' ? m.showsPlayed : 0;
          return (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-slate-500 font-black tabular-nums w-8 shrink-0">
                  {rank}
                </span>
                <Link
                  to={`/user/${m.id}`}
                  className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline truncate"
                >
                  {handle}
                </Link>
              </div>
              <div className="flex items-center gap-6 shrink-0 text-right">
                <div>
                  <p className="font-black text-emerald-400 text-lg tabular-nums leading-none">
                    {pts}
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    pts
                  </p>
                </div>
                <div>
                  <p className="font-black text-white text-lg tabular-nums leading-none">
                    {played}
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    shows
                  </p>
                </div>
              </div>
            </li>
          );
        })}
        </ul>
      )}
    </section>
  );
}
