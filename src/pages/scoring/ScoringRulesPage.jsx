import React from 'react';
import { Link } from 'react-router-dom';
import { SCORING_RULES } from '../../shared/utils/scoring.js';

const {
  EXACT_SLOT,
  ENCORE_EXACT,
  IN_SETLIST,
  WILDCARD_HIT,
  BUSTOUT_BOOST,
  BUSTOUT_MIN_GAP,
} = SCORING_RULES;

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

      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 shadow-lg">
        <h1 className="font-display text-display-md font-bold uppercase tracking-tight text-white mb-2">
          Scoring rules
        </h1>
        <p className="text-slate-400 text-sm font-bold leading-relaxed mb-6">
          As songs are played, scoring updates live. Each pick is scored per slot. Totals are summed for the
          leaderboard.
        </p>

        <ul className="space-y-5">
          <li className="flex gap-4">
            <span className="shrink-0 w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-lg tabular-nums">
              {EXACT_SLOT}
            </span>
            <div>
              <h2 className="font-bold text-white text-sm uppercase tracking-widest mb-1">Exact slot</h2>
              <p className="text-slate-400 text-sm font-bold leading-relaxed">
                Your song matches that slot on the official setlist (Set 1 opener/closer, Set 2 opener/closer).
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="shrink-0 w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center font-black text-teal-300 text-lg tabular-nums">
              {ENCORE_EXACT}
            </span>
            <div>
              <h2 className="font-bold text-white text-sm uppercase tracking-widest mb-1">Exact encore</h2>
              <p className="text-slate-400 text-sm font-bold leading-relaxed">
                Encore pick only: your song matches the official encore slot.
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="shrink-0 w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center font-black text-blue-400 text-lg tabular-nums">
              {IN_SETLIST}
            </span>
            <div>
              <h2 className="font-bold text-white text-sm uppercase tracking-widest mb-1">In setlist</h2>
              <p className="text-slate-400 text-sm font-bold leading-relaxed">
                The song was played, but not in the slot you picked.
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="shrink-0 w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center font-black text-violet-300 text-lg tabular-nums">
              {WILDCARD_HIT}
            </span>
            <div>
              <h2 className="font-bold text-white text-sm uppercase tracking-widest mb-1">Wildcard</h2>
              <p className="text-slate-400 text-sm font-bold leading-relaxed">
                For the wildcard pick only: if your song was played anywhere in the show (full setlist), you
                earn {WILDCARD_HIT} points. Wrong song scores 0.
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="shrink-0 w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-lg tabular-nums">
              +{BUSTOUT_BOOST}
            </span>
            <div>
              <h2 className="font-bold text-white text-sm uppercase tracking-widest mb-1">Bustout boost</h2>
              <p className="text-slate-400 text-sm font-bold leading-relaxed">
                If your pick earns exact-slot, in-setlist, or wildcard points and the song’s gap in our catalog
                is{' '}
                <span className="text-slate-300">{BUSTOUT_MIN_GAP} shows or more</span> since it was last
                played, you get an
                extra <span className="text-slate-300">{BUSTOUT_BOOST} points</span> for that slot. Songs not in
                the catalog only get the base points.
              </p>
            </div>
          </li>
        </ul>

        <p className="mt-8 pt-6 border-t border-slate-700/80 text-slate-500 text-xs font-bold leading-relaxed">
          Missed picks score 0. Maximum per slot is {ENCORE_EXACT + BUSTOUT_BOOST} (encore exact plus bustout)
          or {EXACT_SLOT + BUSTOUT_BOOST} / {WILDCARD_HIT + BUSTOUT_BOOST} for other slots when bustout
          applies.
        </p>
      </div>
    </div>
  );
}
