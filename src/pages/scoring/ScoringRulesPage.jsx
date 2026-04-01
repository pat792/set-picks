import React from 'react';
import { Link } from 'react-router-dom';

import { ScoringRulesContent } from '../../features/scoring';

export default function ScoringRules() {
  return (
    <div className="w-full max-w-xl mx-auto space-y-6 pb-24 text-white">
      <p className="text-sm text-slate-400 font-bold px-1">
        <Link
          to="/dashboard"
          className="text-emerald-400 hover:text-emerald-300 hover:underline underline-offset-2"
        >
          Picks
        </Link>
        <span className="text-slate-600 mx-2">·</span>
        <Link
          to="/dashboard/standings"
          className="text-emerald-400 hover:text-emerald-300 hover:underline underline-offset-2"
        >
          Standings
        </Link>
      </p>

      <ScoringRulesContent />
    </div>
  );
}
