import React from 'react';
import { Link } from 'react-router-dom';

export default function PoolHubLeaderboard({ members }) {
  return (
    <>
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
            const wins = typeof m.wins === 'number' ? m.wins : 0;
            const played =
              typeof m.showsPlayed === 'number' ? m.showsPlayed : 0;
            return (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 sm:gap-3 bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3 min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-slate-500 font-black tabular-nums w-8 shrink-0">
                    {rank}
                  </span>
                  <Link
                    to={`/user/${m.id}`}
                    className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline truncate min-w-0"
                  >
                    {handle}
                  </Link>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-emerald-400 tabular-nums leading-none">
                      {pts}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Points
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-white tabular-nums leading-none">
                      {wins}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Wins
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-white tabular-nums leading-none">
                      {played}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Shows
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
