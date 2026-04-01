import React from 'react';
import LeaderboardRow from './LeaderboardRow';

export default function LeaderboardList({
  sortedPicks,
  actualSetlist,
  expandedUser,
  onToggle,
  getPickPayload,
  title = 'Leaderboard',
  headerEnd = null,
}) {
  if (sortedPicks.length === 0) {
    return (
      <div className="text-center text-slate-500 mt-10 font-bold">
        No picks have been submitted yet!
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 text-white">
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 px-2">
        <h2 className="font-display min-w-0 flex-1 text-sm font-bold uppercase leading-snug break-words sm:text-display-sm md:text-display-md-lg sm:leading-none">
          {title}
        </h2>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-start sm:self-center pt-0.5 sm:pt-0">
          {headerEnd}
          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
            {sortedPicks.length} Players
          </span>
        </div>
      </div>

      {sortedPicks.map((p) => {
        const uniqueId = p.uid || p.id;
        const userPicks = getPickPayload(p);
        const isExpanded = expandedUser === uniqueId;

        return (
          <LeaderboardRow
            key={uniqueId}
            p={p}
            actualSetlist={actualSetlist}
            isExpanded={isExpanded}
            onToggle={() => onToggle(uniqueId)}
            userPicks={userPicks}
          />
        );
      })}
    </div>
  );
}
