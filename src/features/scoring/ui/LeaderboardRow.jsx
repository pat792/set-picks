import React from 'react';
import { Link } from 'react-router-dom';
import { calculateTotalScore } from '../../../shared/utils/scoring';
import ScoreBreakdownGrid from './ScoreBreakdownGrid';

const rankBadgeClass = (rank) => {
  if (rank === 1) return 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40';
  if (rank === 2)
    return 'bg-brand-accent-blue/15 text-blue-200 ring-1 ring-brand-accent-blue/35';
  if (rank === 3) return 'bg-orange-900/40 text-orange-200 ring-1 ring-orange-700/40';
  return 'bg-surface-inset text-slate-300 ring-1 ring-border-muted';
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
      className={`bg-surface-panel rounded-2xl border overflow-hidden shadow-inset-glass transition-all ${
        isLeaderRow ? 'border-border-venue/55 ring-1 ring-brand-primary/15' : 'border-border-subtle/35'
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
        className="w-full flex items-center justify-between p-5 hover:bg-surface-panel-strong/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-t-2xl"
      >
        <div className="flex items-center gap-3 text-left min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black tabular-nums ${rankBadgeClass(rank)}`}
            aria-label={`Rank ${rank}`}
          >
            {rank}
          </div>
          <div className="w-10 h-10 shrink-0 bg-gradient-to-tr from-brand-accent-blue to-brand-primary rounded-full flex items-center justify-center font-bold text-lg shadow-inner text-brand-bg-deep">
            👤
          </div>
          {playerUserId ? (
            <Link
              to={`/user/${playerUserId}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-base tracking-tight text-brand-primary hover:text-brand-primary-strong hover:underline decoration-brand-primary/70 underline-offset-2"
            >
              {p.handle || 'Anonymous'}
            </Link>
          ) : (
            <span className="font-bold text-white text-base tracking-tight">{p.handle || 'Anonymous'}</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="font-black text-brand-primary text-xl block leading-none">
              {actualSetlist ? score : '-'}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-content-secondary">
              Points
            </span>
          </div>
          <div className={`text-content-secondary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-border-subtle/30 bg-surface-inset">
          <ScoreBreakdownGrid userPicks={userPicks} actualSetlist={actualSetlist} />
        </div>
      )}
    </div>
  );
}
