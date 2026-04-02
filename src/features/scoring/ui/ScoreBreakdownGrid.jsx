import React from 'react';
import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import { getSlotScoreBreakdown, SCORING_RULES } from '../../../shared/utils/scoring';

export default function ScoreBreakdownGrid({ userPicks, actualSetlist }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {FORM_FIELDS.map((field) => {
        const userGuess = userPicks[field.id] || '';
        const { points: pts, bustoutBoost } = getSlotScoreBreakdown(
          field.id,
          userGuess,
          actualSetlist
        );

        let borderStyle = 'border-slate-700/50';
        let textColor = 'text-slate-300';

        if (actualSetlist) {
          const { EXACT_SLOT, ENCORE_EXACT, IN_SETLIST, WILDCARD_HIT, BUSTOUT_BOOST } =
            SCORING_RULES;
          const exactHit =
            pts === EXACT_SLOT ||
            pts === EXACT_SLOT + BUSTOUT_BOOST ||
            pts === ENCORE_EXACT ||
            pts === ENCORE_EXACT + BUSTOUT_BOOST ||
            pts === WILDCARD_HIT ||
            pts === WILDCARD_HIT + BUSTOUT_BOOST;
          const inSetHit = pts === IN_SETLIST || pts === IN_SETLIST + BUSTOUT_BOOST;

          if (exactHit) {
            borderStyle = 'border-emerald-500/50 bg-emerald-500/10';
            textColor = 'text-emerald-400';
          } else if (inSetHit) {
            borderStyle = 'border-blue-500/50 bg-blue-500/10';
            textColor = 'text-blue-400';
          }
        }

        return (
          <div key={field.id} className={`p-3 rounded-xl border ${borderStyle} flex flex-col gap-1.5`}>
            <span className="text-[8px] uppercase text-slate-500 font-bold">{field.label}</span>
            <span className={`text-xs font-bold truncate ${textColor}`}>{userGuess || '—'}</span>
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
  );
}
