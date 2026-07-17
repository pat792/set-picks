import React from 'react';
import PlayerHandleLink from '../../../shared/ui/PlayerHandleLink';
import { calculateTotalScore } from '../../../shared/utils/scoring';
import { StandingsPlayerAvatar } from '../../profile';
import ScoreBreakdownGrid from './ScoreBreakdownGrid';

export function rankBadgeClass(rank) {
  if (rank === 1) return 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40';
  if (rank === 2)
    return 'bg-brand-accent-blue/15 text-blue-200 ring-1 ring-brand-accent-blue/35';
  if (rank === 3) return 'bg-orange-900/40 text-orange-200 ring-1 ring-orange-700/40';
  return 'bg-surface-inset text-slate-300 ring-1 ring-border-muted';
}

export default function LeaderboardRow({
  rank,
  isLeaderRow = false,
  isSelf = false,
  p,
  actualSetlist,
  isExpanded,
  onToggle,
  userPicks,
  /** Pre-lock privacy (#303): blur opponent song titles in the breakdown. */
  maskPickTitles = false,
  /** In-page anchor for “jump to your card” from StandingsSelfRecapCard. */
  anchorId = null,
  /** Optional identity from `usePlayerIdentityMap`. */
  identity = null,
}) {
  const uniqueId = p.uid || p.id;
  const playerUserId = p.userId || p.uid;
  const score = calculateTotalScore(userPicks, actualSetlist);
  const avatarId =
    identity?.avatarId ??
    (typeof p.avatarId === 'string' ? p.avatarId : null);
  const badges = identity?.badges ?? null;

  // Self gets a stronger brand ring so users can locate themselves at
  // a glance — doubly useful pre-grade when the row is pinned to rank 1.
  const borderTone = isSelf
    ? 'border-brand-primary/55 ring-1 ring-brand-primary/35'
    : isLeaderRow
    ? 'border-border-venue/55 ring-1 ring-brand-primary/15'
    : 'border-border-subtle/35';

  return (
    <div
      id={anchorId || undefined}
      className={`bg-surface-panel rounded-xl border overflow-hidden shadow-inset-glass transition-all scroll-mt-24 md:scroll-mt-28 ${borderTone}`}
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
        className="w-full flex items-center justify-between px-3.5 py-3.5 hover:bg-surface-panel-strong/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-t-xl md:px-4 md:py-4"
      >
        <div className="flex items-center gap-3 text-left min-w-0">
          {rank != null ? (
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black tabular-nums ${rankBadgeClass(rank)}`}
              aria-label={`Rank ${rank}`}
            >
              {rank}
            </div>
          ) : (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-black uppercase tracking-widest bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/40"
              aria-label="Pinned — you"
            >
              You
            </div>
          )}
          <StandingsPlayerAvatar
            avatarId={avatarId}
            badges={badges}
            isSelf={isSelf}
            handle={p.handle}
          />
          <div className="flex items-center gap-2 min-w-0">
            <PlayerHandleLink
              userId={playerUserId}
              handle={p.handle}
              className="text-sm md:text-base"
            />
            {isSelf && rank != null ? (
              <span
                className="inline-flex items-center rounded-full bg-brand-primary/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-brand-primary ring-1 ring-brand-primary/40"
                aria-label="You"
              >
                You
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="font-black text-brand-primary text-base block leading-none md:text-lg">
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
        <div className="p-3.5 border-t border-border-subtle/30 bg-surface-inset md:p-4">
          <ScoreBreakdownGrid
            userPicks={userPicks}
            actualSetlist={actualSetlist}
            maskPickTitles={maskPickTitles}
          />
        </div>
      )}
    </div>
  );
}
