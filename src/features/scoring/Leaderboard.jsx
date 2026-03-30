import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FORM_FIELDS } from '../../shared/data/gameConfig.js';
import { getSlotScoreBreakdown, calculateTotalScore, SCORING_RULES } from '../../shared/utils/scoring.js';

const Leaderboard = ({ poolPicks = [], actualSetlist = null }) => {
  const [expandedUser, setExpandedUser] = useState(null);
  const getPickPayload = (pickEntry) => {
    if (pickEntry?.picks && typeof pickEntry.picks === 'object') {
      return pickEntry.picks;
    }

    // Backward compatibility for legacy docs where picks lived at the root.
    return FORM_FIELDS.reduce((acc, field) => {
      acc[field.id] = pickEntry?.[field.id] || '';
      return acc;
    }, {});
  };

  // Automatically sort players by highest score!
  const sortedPicks = [...poolPicks].sort((a, b) => {
    const scoreA = calculateTotalScore(getPickPayload(a), actualSetlist);
    const scoreB = calculateTotalScore(getPickPayload(b), actualSetlist);
    return scoreB - scoreA; // Highest score at the top
  });

  if (poolPicks.length === 0) {
    return <div className="text-center text-slate-500 mt-10 font-bold">No picks have been submitted yet!</div>;
  }

  return (
    <div className="space-y-4 pb-24 text-white">
      <div className="flex justify-between items-center px-2">
        <h2 className="font-display text-display-md-lg font-bold uppercase">Leaderboard</h2>
        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
          {poolPicks.length} Players
        </span>
      </div>

      {sortedPicks.map((p) => {
        // Use p.uid or p.id depending on how Firebase returned it
        const uniqueId = p.uid || p.id;
        const playerUserId = p.userId || p.uid;
        const isExpanded = expandedUser === uniqueId;
        const userPicks = getPickPayload(p);
        const score = calculateTotalScore(userPicks, actualSetlist);

        return (
          <div key={uniqueId} className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-lg transition-all">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedUser(isExpanded ? null : uniqueId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setExpandedUser(isExpanded ? null : uniqueId);
                }
              }}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 rounded-t-2xl"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full flex items-center justify-center font-bold text-lg shadow-inner">👤</div>
                {playerUserId ? (
                  <Link
                    to={`/user/${playerUserId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-base tracking-tight text-emerald-400 hover:text-emerald-300 hover:underline decoration-emerald-400/70 underline-offset-2"
                  >
                    {p.handle || 'Anonymous'}
                  </Link>
                ) : (
                  <span className="font-bold text-white text-base tracking-tight">
                    {p.handle || 'Anonymous'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="font-black text-emerald-400 text-xl block leading-none">
                    {actualSetlist ? score : '-'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Points</span>
                </div>
                <div className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</div>
              </div>
            </div>

            {isExpanded && (
              <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
                <div className="grid grid-cols-2 gap-3">
                  {FORM_FIELDS.map(field => {
                    const userGuess = userPicks[field.id] || '';
                    const { points: pts, bustoutBoost } = getSlotScoreBreakdown(field.id, userGuess, actualSetlist);

                    let borderStyle = "border-slate-700/50";
                    let textColor = "text-slate-300";

                    if (actualSetlist) {
                      const {
                        EXACT_SLOT,
                        ENCORE_EXACT,
                        IN_SETLIST,
                        WILDCARD_HIT,
                        BUSTOUT_BOOST,
                      } = SCORING_RULES;
                      const exactHit =
                        pts === EXACT_SLOT ||
                        pts === EXACT_SLOT + BUSTOUT_BOOST ||
                        pts === ENCORE_EXACT ||
                        pts === ENCORE_EXACT + BUSTOUT_BOOST ||
                        pts === WILDCARD_HIT ||
                        pts === WILDCARD_HIT + BUSTOUT_BOOST;
                      const inSetHit = pts === IN_SETLIST || pts === IN_SETLIST + BUSTOUT_BOOST;
                      if (exactHit) { borderStyle = "border-emerald-500/50 bg-emerald-500/10"; textColor = "text-emerald-400"; }
                      else if (inSetHit) { borderStyle = "border-blue-500/50 bg-blue-500/10"; textColor = "text-blue-400"; }
                    }

                    return (
                      <div key={field.id} className={`p-3 rounded-xl border ${borderStyle} flex flex-col gap-1.5`}>
                        <span className="text-[8px] uppercase text-slate-500 font-bold">{field.label}</span>
                        <span className={`text-xs font-bold truncate ${textColor}`}>{userGuess || "—"}</span>
                        {actualSetlist && pts > 0 && (
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black text-slate-500 uppercase tabular-nums tracking-wide">
                              {pts} pts
                            </span>
                            {bustoutBoost && (
                              <span
                                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/35"
                                title={`+${SCORING_RULES.BUSTOUT_BOOST} bustout bonus`}
                              >
                                Bustout boost
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Leaderboard;