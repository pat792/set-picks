import React from 'react';
import { Info } from 'lucide-react';

import {
  LEADING_THIS_SHOW,
  SHOW_STANDINGS_EYEBROW,
  STANDINGS_PICK_PRIVACY_INFO_LABEL,
  STANDINGS_PICK_PRIVACY_TOOLTIP,
} from '../../../shared/config/dashboardVocabulary';
import { calculateTotalScore } from '../../../shared/utils/scoring';
import MetaChip from '../../../shared/ui/MetaChip';

import LeaderboardRow from './LeaderboardRow';

export default function LeaderboardList({
  sortedPicks,
  actualSetlist,
  expandedUser,
  onToggle,
  getPickPayload,
  title = 'Everyone',
  headerEnd = null,
  selfUserId = null,
  /** When true, hide the top “Leading this show” callout (e.g. Standings already shows “Tonight’s winner”). */
  suppressLeadingCallout = false,
  /** Pre-lock: blur opponent pick titles in expanded rows (#303). */
  redactOpponentPicksPreLock = false,
}) {
  if (sortedPicks.length === 0) {
    return (
      <div className="mt-10 text-center font-bold text-content-secondary">
        No one is on the show standings for this date yet.
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
    !suppressLeadingCallout &&
    Boolean(actualSetlist && leader && leaderScore != null && sortedPicks.length > 0);

  return (
    <div className="space-y-4 pb-6 md:pb-16 text-white">
      {showLeaderCallout ? (
        <div
          className="mx-0.5 rounded-xl border border-brand-primary/35 bg-brand-primary/[0.07] px-4 py-3 shadow-inset-glass"
          role="status"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
            {LEADING_THIS_SHOW}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-100">
            <span className="text-brand-primary">{leader.handle || 'Anonymous'}</span>
            {' — '}
            <span className="tabular-nums text-white">{leaderScore}</span>
            <span className="font-semibold text-content-secondary"> pts</span>
            {sortedPicks.length > 1 ? (
              <span className="mt-1 block text-xs font-medium text-content-secondary">
                Expand a row to compare picks and points for this show.
              </span>
            ) : null}
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 px-2">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-bold uppercase leading-snug break-words text-content-secondary sm:text-display-sm md:text-display-md-lg sm:leading-none">
            {SHOW_STANDINGS_EYEBROW}
          </h2>
          <p className="mt-0.5 font-display text-base font-bold text-white break-words sm:text-lg md:text-xl">
            {title}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-start sm:self-center pt-0.5 sm:pt-0">
          {headerEnd}
          <MetaChip>
            {sortedPicks.length} {sortedPicks.length === 1 ? 'player' : 'players'}
          </MetaChip>
        </div>
      </div>

      {redactOpponentPicksPreLock ? (
        <div
          role="note"
          aria-label={STANDINGS_PICK_PRIVACY_INFO_LABEL}
          className="mx-0.5 mb-2 flex gap-3 rounded-xl border border-brand-primary/30 bg-brand-primary/[0.08] px-4 py-3 shadow-inset-glass"
        >
          <Info className="h-5 w-5 shrink-0 text-brand-primary mt-0.5" aria-hidden />
          <p className="text-sm font-semibold leading-relaxed text-slate-100">
            {STANDINGS_PICK_PRIVACY_TOOLTIP}
          </p>
        </div>
      ) : null}

      {sortedPicks.map((p, index) => {
        const uniqueId = p.uid || p.id;
        const userPicks = getPickPayload(p);
        const isExpanded = expandedUser === uniqueId;
        const rank = index + 1;
        const isSelf = Boolean(selfUserId) && (p.userId || p.uid) === selfUserId;
        const maskPickTitles =
          Boolean(redactOpponentPicksPreLock) && !isSelf;
        // Pre-grade, the self row is pinned to rank 1 by `useLeaderboard`;
        // skip the natural rank badge so users don't misread "1" as a
        // scoring result before the setlist lands.
        const displayRank = isSelf && !actualSetlist ? null : rank;

        return (
          <LeaderboardRow
            key={uniqueId}
            rank={displayRank}
            isLeaderRow={showLeaderCallout && uniqueId === leaderId}
            isSelf={isSelf}
            p={p}
            actualSetlist={actualSetlist}
            isExpanded={isExpanded}
            onToggle={() => onToggle(uniqueId)}
            userPicks={userPicks}
            maskPickTitles={maskPickTitles}
          />
        );
      })}
    </div>
  );
}
