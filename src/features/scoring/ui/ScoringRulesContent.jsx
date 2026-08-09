import React from 'react';
import { MARKETING_EDITORIAL_H1_INSET } from '../../../shared/ui/marketingEditorialChrome.js';
import { SCORING_RULES } from '../../../shared/utils/scoring.js';

const {
  EXACT_SLOT,
  ENCORE_EXACT,
  IN_SETLIST,
  WILDCARD_HIT,
  BUSTOUT_BOOST,
  BUSTOUT_MIN_GAP,
} = SCORING_RULES;

const SURFACES = {
  dark: {
    shell:
      'rounded-2xl border border-border-muted/45 bg-surface-panel p-6 shadow-inset-glass ring-1 ring-border-glass/25',
    title:
      'font-display text-display-md font-bold uppercase tracking-tight text-white mb-2',
    lede: 'mb-6 text-sm font-bold leading-relaxed text-content-secondary',
    ruleTitle:
      'font-bold text-white text-sm uppercase tracking-widest mb-1',
    ruleBody: 'text-sm font-bold leading-relaxed text-content-secondary',
    ruleBodyEmph: 'text-slate-300',
    footnote:
      'mt-6 scroll-mt-4 border-t border-border-subtle/30 pt-4 text-xs font-bold leading-snug text-content-secondary/90',
    footnoteStar: 'mr-1 text-amber-400',
    starLink:
      'ml-0.5 align-super text-[0.65rem] text-amber-400 no-underline hover:text-amber-300',
    chips: {
      inSetlist:
        'shrink-0 w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center font-black text-blue-400 text-lg tabular-nums',
      exact:
        'shrink-0 w-12 h-12 rounded-xl bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center font-black text-brand-primary text-lg tabular-nums',
      wildcard:
        'shrink-0 w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center font-black text-violet-300 text-lg tabular-nums',
      encore:
        'shrink-0 w-12 h-12 rounded-xl bg-brand-primary/12 border border-brand-primary/25 flex items-center justify-center font-black text-brand-primary text-lg tabular-nums',
      bustout:
        'shrink-0 w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-lg tabular-nums',
    },
  },
  light: {
    // Soft paper panel — not dark glass island on slate-50 (#944).
    shell:
      'rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 md:p-8',
    title: MARKETING_EDITORIAL_H1_INSET,
    lede: 'mb-6 text-sm font-semibold leading-relaxed text-slate-600',
    ruleTitle:
      'mb-1 text-sm font-bold uppercase tracking-widest text-slate-900',
    ruleBody: 'text-sm font-semibold leading-relaxed text-slate-600',
    ruleBodyEmph: 'font-bold text-slate-800',
    footnote:
      'mt-6 scroll-mt-4 border-t border-slate-200 pt-4 text-xs font-semibold leading-snug text-slate-600',
    footnoteStar: 'mr-1 font-bold text-amber-700',
    starLink:
      'ml-0.5 align-super text-[0.65rem] font-bold text-amber-700 no-underline hover:text-amber-800',
    chips: {
      inSetlist:
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-600/35 bg-blue-500/15 text-lg font-black tabular-nums text-blue-700',
      exact:
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-600/40 bg-teal-500/15 text-lg font-black tabular-nums text-teal-800',
      wildcard:
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-600/35 bg-violet-500/15 text-lg font-black tabular-nums text-violet-800',
      encore:
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-600/35 bg-teal-500/12 text-lg font-black tabular-nums text-teal-800',
      bustout:
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-600/40 bg-amber-500/15 text-lg font-black tabular-nums text-amber-800',
    },
  },
};

/**
 * Presentational scoring rules — dashboard modal (`surface="dark"`, default)
 * and marketing `/how-scoring-works` (`surface="light"`) (#944).
 *
 * Marketing pages should own the editorial H1/lede and pass `includeIntro={false}`
 * so the title matches HIW / About / keyword (not an in-card header).
 *
 * @param {{ surface?: 'dark' | 'light', includeIntro?: boolean }} props
 */
export default function ScoringRulesContent({
  surface = 'dark',
  includeIntro = true,
}) {
  const isLight = surface === 'light';
  const t = isLight ? SURFACES.light : SURFACES.dark;

  return (
    <div className={t.shell}>
      {includeIntro ? (
        <>
          <h1 id="scoring-rules-heading" className={t.title}>
            {isLight ? 'How scoring works' : 'How Scoring Works'}
          </h1>
          <p className={t.lede}>
            Picks earn points based on where they land in the setlist. Live scoring feeds
            nightly standings.
          </p>
        </>
      ) : null}

      <ul className="space-y-5">
        <li className="flex gap-4">
          <span className={t.chips.inSetlist}>{IN_SETLIST}</span>
          <div>
            <h2 className={t.ruleTitle}>In setlist</h2>
            <p className={t.ruleBody}>
              Your pick got played, just not in the slot you called. Partial credit for nailing
              the song.
            </p>
          </div>
        </li>

        <li className="flex gap-4">
          <span className={t.chips.exact}>{EXACT_SLOT}</span>
          <div>
            <h2 className={t.ruleTitle}>Exact slot</h2>
            <p className={t.ruleBody}>
              Your pick lands on the exact slot you chose &mdash; Set 1 opener or closer,
              or Set 2 opener or closer.
            </p>
          </div>
        </li>

        <li className="flex gap-4">
          <span className={t.chips.wildcard}>{WILDCARD_HIT}</span>
          <div>
            <h2 className={t.ruleTitle}>Wildcard</h2>
            <p className={t.ruleBody}>
              If your Wildcard pick is played anywhere in the setlist, you score {WILDCARD_HIT}{' '}
              points.
            </p>
          </div>
        </li>

        <li className="flex gap-4">
          <span className={t.chips.encore}>{ENCORE_EXACT}</span>
          <div>
            <h2 className={t.ruleTitle}>Encore</h2>
            <p className={t.ruleBody}>
              Your pick is played during the encore. Worth a little more because the encore is
              the toughest call.
            </p>
          </div>
        </li>

        <li className="flex gap-4">
          <span className={t.chips.bustout}>+{BUSTOUT_BOOST}</span>
          <div>
            <h2 className={t.ruleTitle}>Bustout Boost™</h2>
            <p className={t.ruleBody}>
              Correct picks on songs with a{' '}
              <span className={t.ruleBodyEmph}>{BUSTOUT_MIN_GAP}+ show gap</span> earn a bonus{' '}
              <span className={t.ruleBodyEmph}>{BUSTOUT_BOOST} points</span> on top of base points
              &mdash; rewarding strategic picks over heavy rotation.
              <a
                href="#scoring-rules-footnote"
                aria-describedby="scoring-rules-footnote"
                className={t.starLink}
              >
                *
              </a>
            </p>
          </div>
        </li>
      </ul>

      <p id="scoring-rules-footnote" className={t.footnote}>
        <span className={t.footnoteStar}>*</span>
        Max per slot (if pick earns Bustout Boost): {IN_SETLIST + BUSTOUT_BOOST} in setlist &middot;{' '}
        {EXACT_SLOT + BUSTOUT_BOOST} exact slot &middot; {WILDCARD_HIT + BUSTOUT_BOOST} wildcard
        &middot; {ENCORE_EXACT + BUSTOUT_BOOST} encore.
      </p>
    </div>
  );
}
