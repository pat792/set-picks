import React from 'react';

import { calculateTotalScore } from '../../../shared/utils/scoring';
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

  const leader = sortedPicks[0];
  const leaderId = leader?.uid || leader?.id;
  const leaderScore =
    leader && actualSetlist
      ? calculateTotalScore(getPickPayload(leader), actualSetlist)
      : null;
  const showLeaderCallout =
    Boolean(actualSetlist && leader && leaderScore != null && sortedPicks.length > 0);

  return (
    <div className="space-y-4 pb-6 md:pb-16 text-white">
      {showLeaderCallout ? (
        <div
          className="rounded-xl border border-emerald-500/35 bg-emerald-500/[0.07] px-4 py-3 mx-0.5"
          role="status"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/90">
            In the lead
          </p>
          <p className="mt-1 text-sm font-bold text-slate-100">
            <span className="text-emerald-400">{leader.handle || 'Anonymous'}</span>
            {' — '}
            <span className="tabular-nums text-white">{leaderScore}</span>
            <span className="font-semibold text-slate-400"> pts</span>
            {sortedPicks.length > 1 ? (
              <span className="block mt-1 text-xs font-medium text-slate-500">
                Tap a row below to compare picks and points.
              </span>
            ) : null}
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 px-2">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-bold uppercase leading-snug break-words text-slate-400 sm:text-display-sm md:text-display-md-lg sm:leading-none">
            Rankings
          </h2>
          <p className="mt-0.5 font-display text-base font-bold text-white break-words sm:text-lg md:text-xl">
            {title}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-start sm:self-center pt-0.5 sm:pt-0">
          {headerEnd}
          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full whitespace-nowrap">
            {sortedPicks.length} {sortedPicks.length === 1 ? 'player' : 'players'}
          </span>
        </div>
      </div>

      {sortedPicks.map((p, index) => {
        const uniqueId = p.uid || p.id;
        const userPicks = getPickPayload(p);
        const isExpanded = expandedUser === uniqueId;
        const rank = index + 1;

        return (
          <LeaderboardRow
            key={uniqueId}
            rank={rank}
            isLeaderRow={showLeaderCallout && uniqueId === leaderId}
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
