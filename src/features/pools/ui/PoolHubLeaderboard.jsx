import React from 'react';

import PlayerHandleLink from '../../../shared/ui/PlayerHandleLink';

export default function PoolHubLeaderboard({ members }) {
  return (
    <>
      {members.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-panel p-8 text-center font-bold text-content-secondary shadow-inset-glass">
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
            const showsLabel = String(played);
            return (
              <li
                key={m.id}
                className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-border-subtle bg-surface-panel px-4 py-3 shadow-inset-glass sm:gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-8 shrink-0 font-black tabular-nums text-content-secondary/90">
                    {rank}
                  </span>
                  <PlayerHandleLink
                    userId={m.id}
                    handle={handle}
                    className="min-w-0 truncate"
                  />
                </div>
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold tabular-nums leading-none text-brand-primary">
                      {pts}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-content-secondary">
                      Points
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-white tabular-nums leading-none">
                      {wins}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-content-secondary">
                      Wins
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-white tabular-nums leading-none">
                      {showsLabel}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-content-secondary">
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
