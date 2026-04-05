import React from 'react';
import { Link } from 'react-router-dom';
import { calculateTotalScore } from '../../../shared/utils/scoring';
import ScoreBreakdownGrid from './ScoreBreakdownGrid';

const rankBadgeClass = (rank) => {
  if (rank === 1) return 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40';
  if (rank === 2) return 'bg-slate-500/25 text-slate-200 ring-1 ring-slate-500/35';
  if (rank === 3) return 'bg-orange-900/40 text-orange-200 ring-1 ring-orange-700/40';
  return 'bg-slate-700/80 text-slate-400 ring-1 ring-slate-600/60';
};

export default function LeaderboardRow({
  rank,
  isLeaderRow = false,
  p,
  actualSetlist,
  isExpanded,
  onToggle,
  userPicks,
}) {
  const uniqueId = p.uid || p.id;
  const playerUserId = p.userId || p.uid;
  const score = calculateTotalScore(userPicks, actualSetlist);

  return (
    <div
      className={`bg-slate-800/80 rounded-2xl border overflow-hidden shadow-lg transition-all ${
        isLeaderRow ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-slate-700'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 rounded-t-2xl"
      >
        <div className="flex items-center gap-3 text-left min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black tabular-nums ${rankBadgeClass(rank)}`}
            aria-label={`Rank ${rank}`}
          >
            {rank}
          </div>
          <div className="w-10 h-10 shrink-0 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
            👤
          </div>
          {playerUserId ? (
            <Link
              to={`/user/${playerUserId}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-base tracking-tight text-emerald-400 hover:text-emerald-300 hover:underline decoration-emerald-400/70 underline-offset-2"
            >
              {p.handle || 'Anonymous'}
            </Link>
          ) : (
            <span className="font-bold text-white text-base tracking-tight">{p.handle || 'Anonymous'}</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="font-black text-emerald-400 text-xl block leading-none">
              {actualSetlist ? score : '-'}
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Points
            </span>
          </div>
          <div className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
          <ScoreBreakdownGrid userPicks={userPicks} actualSetlist={actualSetlist} />
        </div>
      )}
    </div>
  );
}
