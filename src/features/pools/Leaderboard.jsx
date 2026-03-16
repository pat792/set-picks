import React, { useState } from 'react';

const Leaderboard = ({ poolPicks, actualSetlist, getTotalScore, formFields }) => {
  const [expandedUser, setExpandedUser] = useState(null);

  // Helper to determine points for specific song slots
  const getPointValue = (fieldId, guessedSong) => {
    if (!actualSetlist || !guessedSong) return null;
    if (actualSetlist[fieldId]?.toLowerCase() === guessedSong.toLowerCase()) return 1;
    const allPlayed = Object.values(actualSetlist).map(s => s?.toLowerCase());
    return allPlayed.includes(guessedSong.toLowerCase()) ? 0.5 : 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-black italic uppercase">Leaderboard</h2>
        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
          {poolPicks.length} Players
        </span>
      </div>

      {poolPicks.map((p) => {
        const isExpanded = expandedUser === p.id;
        const score = getTotalScore(p);

        return (
          <div key={p.id} className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-lg transition-all">
            <button 
              onClick={() => setExpandedUser(isExpanded ? null : p.id)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full flex items-center justify-center font-bold text-lg shadow-inner">👤</div>
                <span className="font-black text-white text-base tracking-tight">{p.handle}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="font-black text-emerald-400 text-xl block leading-none">{actualSetlist ? score : '-'}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Points</span>
                </div>
                <div className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</div>
              </div>
            </button>

            {isExpanded && (
              <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
                <div className="grid grid-cols-2 gap-3">
                  {formFields.map(field => {
                    const pts = getPointValue(field.id, p[field.id]);
                    let borderStyle = "border-slate-700/50";
                    let textColor = "text-slate-300";

                    if (pts === 1) { borderStyle = "border-emerald-500/50 bg-emerald-500/5"; textColor = "text-emerald-400"; }
                    else if (pts === 0.5) { borderStyle = "border-blue-500/50 bg-blue-500/5"; textColor = "text-blue-400"; }

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
