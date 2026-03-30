import React from 'react';
import LeaderboardRow from './LeaderboardRow';

export default function LeaderboardList({
  sortedPicks,
  actualSetlist,
  expandedUser,
  onToggle,
  getPickPayload,
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
      <div className="flex justify-between items-center px-2">
        <h2 className="font-display text-display-md-lg font-bold uppercase">Leaderboard</h2>
        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
          {sortedPicks.length} Players
        </span>
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
