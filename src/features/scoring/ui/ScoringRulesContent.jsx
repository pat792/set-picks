import React from 'react';
import { SCORING_RULES } from '../../../shared/utils/scoring.js';

const {
  EXACT_SLOT,
  ENCORE_EXACT,
  IN_SETLIST,
  WILDCARD_HIT,
  BUSTOUT_BOOST,
  BUSTOUT_MIN_GAP,
} = SCORING_RULES;

/**
 * Presentational copy of scoring rules (used by `ScoringRulesModal`).
 */
export default function ScoringRulesContent() {
  return (
    <div className="rounded-2xl border border-border-muted/45 bg-surface-panel p-6 shadow-inset-glass ring-1 ring-border-glass/25">
      <h1
        id="scoring-rules-heading"
        className="font-display text-display-md font-bold uppercase tracking-tight text-white mb-2"
      >
        How Scoring Works
      </h1>
      <p className="mb-6 text-sm font-bold leading-relaxed text-content-secondary">
        Picks earn points based on where they land in the setlist. Live scoring feeds nightly
        standings.
      </p>

      <ul className="space-y-5">
        <li className="flex gap-4">
          <span className="shrink-0 w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center font-black text-blue-400 text-lg tabular-nums">
            {IN_SETLIST}
          </span>
          <div>
            <h2 className="font-bold text-white text-sm uppercase tracking-widest mb-1">In setlist</h2>
            <p className="text-sm font-bold leading-relaxed text-content-secondary">
              Your pick got played, just not in the slot you called. Partial credit for nailing
              the song.
            </p>
          </div>
        </li>

        <li className="flex gap-4">
          <span className="shrink-0 w-12 h-12 rounded-xl bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center font-black text-brand-primary text-lg tabular-nums">
            {EXACT_SLOT}
          </span>
          <div>
            <h2 className="font-bold text-white text-sm uppercase tracking-widest mb-1">Exact slot</h2>
            <p className="text-sm font-bold leading-relaxed text-content-secondary">
              Your pick lands on the exact slot you chose &mdash; Set 1 opener or closer,
              or Set 2 opener or closer.
            </p>
          </div>
        </li>

        <li className="flex gap-4">
          <span className="shrink-0 w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center font-black text-violet-300 text-lg tabular-nums">
            {WILDCARD_HIT}
          </span>
          <div>
            <h2 className="font-bold text-white text-sm uppercase tracking-widest mb-1">Wildcard</h2>
            <p className="text-sm font-bold leading-relaxed text-content-secondary">
              If your Wildcard pick is played anywhere in the setlist, you score {WILDCARD_HIT} points.
            </p>
          </div>
        </li>

        <li className="flex gap-4">
          <span className="shrink-0 w-12 h-12 rounded-xl bg-brand-primary/12 border border-brand-primary/25 flex items-center justify-center font-black text-brand-primary text-lg tabular-nums">
            {ENCORE_EXACT}
          </span>
          <div>
            <h2 className="font-bold text-white text-sm uppercase tracking-widest mb-1">Encore</h2>
            <p className="text-sm font-bold leading-relaxed text-content-secondary">
              Your pick is played during the encore. Worth a little more because the encore is
              the toughest call.
            </p>
          </div>
        </li>

        <li className="flex gap-4">
          <span className="shrink-0 w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-lg tabular-nums">
            +{BUSTOUT_BOOST}
          </span>
          <div>
            <h2 className="font-bold text-white text-sm uppercase tracking-widest mb-1">Bustout Boost™</h2>
            <p className="text-sm font-bold leading-relaxed text-content-secondary">
              Correct picks on songs with a{' '}
              <span className="text-slate-300">{BUSTOUT_MIN_GAP}+ show gap</span> earn a bonus{' '}
              <span className="text-slate-300">{BUSTOUT_BOOST} points</span> on top of base points &mdash;
              rewarding strategic picks over heavy rotation.
              <a
                href="#scoring-rules-footnote"
                aria-describedby="scoring-rules-footnote"
                className="ml-0.5 align-super text-[0.65rem] text-amber-400 no-underline hover:text-amber-300"
              >
                *
              </a>
            </p>
          </div>
        </li>
      </ul>

      <p
        id="scoring-rules-footnote"
        className="mt-6 scroll-mt-4 border-t border-border-subtle/30 pt-4 text-xs font-bold leading-snug text-content-secondary/90"
      >
        <span className="mr-1 text-amber-400">*</span>
        Max per slot (if pick earns Bustout Boost): {IN_SETLIST + BUSTOUT_BOOST} in setlist &middot;{' '}
        {EXACT_SLOT + BUSTOUT_BOOST} exact slot &middot; {WILDCARD_HIT + BUSTOUT_BOOST} wildcard &middot;{' '}
        {ENCORE_EXACT + BUSTOUT_BOOST} encore.
      </p>
    </div>
  );
}
