import React from 'react';
import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import {
  getSlotScoreBreakdown,
  SCORE_BREAKDOWN_KIND_LABEL,
  SCORING_RULES,
} from '../../../shared/utils/scoring';

export default function ScoreBreakdownGrid({ userPicks, actualSetlist }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {FORM_FIELDS.map((field) => {
        const userGuess = userPicks[field.id] || '';
        const trimmedGuess = String(userGuess).trim();
        const { points: pts, bustoutBoost, kind } = getSlotScoreBreakdown(
          field.id,
          userGuess,
          actualSetlist
        );

        let borderStyle = 'border-indigo-700/60 bg-surface-inset';
        let textColor = 'text-slate-300';
        let markerColor = 'text-slate-500';

        if (actualSetlist && trimmedGuess) {
          if (kind === 'exact_slot' || kind === 'encore_exact' || kind === 'wildcard_hit') {
            borderStyle = 'border-emerald-500/50 bg-emerald-500/10';
            textColor = 'text-emerald-400';
            markerColor = 'text-emerald-500/90';
          } else if (kind === 'in_setlist') {
            borderStyle = 'border-blue-500/50 bg-blue-500/10';
            textColor = 'text-blue-400';
            markerColor = 'text-blue-400/90';
          } else if (kind === 'miss') {
            borderStyle = 'border-indigo-700/70 bg-indigo-900/35';
            textColor = 'text-slate-400';
            markerColor = 'text-slate-500';
          }
        }

        const kindLabel = SCORE_BREAKDOWN_KIND_LABEL[kind] || '';

        return (
          <div key={field.id} className={`p-3 rounded-xl border ${borderStyle} flex flex-col gap-1.5`}>
            <span className="text-[8px] uppercase text-slate-500 font-bold">{field.label}</span>
            <span className={`text-xs font-bold truncate ${textColor}`}>{userGuess || '—'}</span>
            {actualSetlist && trimmedGuess && kindLabel ? (
              <span className={`text-[9px] font-black uppercase tracking-wider ${markerColor}`}>
                {kindLabel}
              </span>
            ) : null}
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
