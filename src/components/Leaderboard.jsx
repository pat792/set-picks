import React, { useState } from 'react';
import { FORM_FIELDS } from '../../data/gameConfig';
import { calculateSlotScore, calculateTotalScore } from '../../utils/scoring';

const Leaderboard = ({ poolPicks = [], actualSetlist = null }) => {
  const [expandedUser, setExpandedUser] = useState(null);

  // Automatically sort players by highest score!
  const sortedPicks = [...poolPicks].sort((a, b) => {
    const scoreA = calculateTotalScore(a, actualSetlist);
    const scoreB = calculateTotalScore(b, actualSetlist);
    return scoreB - scoreA; // Highest score at the top
  });

  if (poolPicks.length === 0) {
    return <div className="text-center text-slate-500 mt-10 font-bold">No picks have been submitted yet!</div>;
  }

  return (
    <div className="space-y-4 pb-24 text-white">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-black italic uppercase">Leaderboard</h2>
        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
          {poolPicks.length} Players
        </span>
      </div>

      {sortedPicks.map((p) => {
        // Use p.uid or p.id depending on how Firebase returned it
        const uniqueId = p.uid || p.id; 
        const isExpanded = expandedUser === uniqueId;
        const score = calculateTotalScore(p, actualSetlist);

        return (
          <div key={uniqueId} className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-lg transition-all">
            <button 
              onClick={() => setExpandedUser(isExpanded ? null : uniqueId)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-700/50 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full flex items-center justify-center font-bold text-lg shadow-inner">👤</div>
                <span className="font-black text-white text-base tracking-tight">{p.handle || "Anonymous"}</span>
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
            </button>

            {isExpanded && (
              <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
                <div className="grid grid-cols-2 gap-3">
                  {FORM_FIELDS.map(field => {
                    const pts = calculateSlotScore(field.id, p[field.id], actualSetlist);
                    let borderStyle = "border-slate-700/50";
                    let textColor = "text-slate-300";

                    if (actualSetlist) {
                      if (pts === 1) { borderStyle = "border-emerald-500/50 bg-emerald-500/10"; textColor = "text-emerald-400"; }
                      else if (pts === 0.5) { borderStyle = "border-blue-500/50 bg-blue-500/10"; textColor = "text-blue-400"; }
                    }

                    return (
                      <div key={field.id} className={`p-3 rounded-xl border ${borderStyle} flex flex-col`}>
                        <span className="text-[8px] uppercase text-slate-500 font-bold mb-1">{field.label}</span>
                        <span className={`text-xs font-bold truncate ${textColor}`}>{p[field.id] || "—"}</span>
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