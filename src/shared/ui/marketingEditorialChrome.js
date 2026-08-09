/**
 * Marketing editorial chrome tokens (#944).
 *
 * Rule: editorial / SEO prose → light main; product / data → dark.
 * Full rule: `content/marketing/944-chrome-rule-review.md`.
 */

/** Full-bleed light article wrapper (HIW, keyword, About, marketing Scoring). */
export const MARKETING_EDITORIAL_ARTICLE =
  'relative z-10 w-full bg-slate-50 py-16 md:py-24';

/** Centered reading column. */
export const MARKETING_EDITORIAL_COLUMN =
  'mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8';

/**
 * Optional eyebrow — keyword / definitional pages only.
 * Omit on HIW, About, Scoring unless the page is SEO-definitional.
 */
export const MARKETING_EDITORIAL_EYEBROW =
  'mb-3 text-center text-[10px] font-black uppercase tracking-widest text-emerald-700';

/** Page H1 — sentence case, slate on light paper. */
export const MARKETING_EDITORIAL_H1 =
  'mb-5 text-center font-display text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl';

/**
 * In-panel / inset H1 on light editorial surfaces (same size ramp, left-aligned).
 * Used by marketing Scoring rules block.
 */
export const MARKETING_EDITORIAL_H1_INSET =
  'mb-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl';

/** Supporting lede under H1. */
export const MARKETING_EDITORIAL_LEDE =
  'mb-10 text-center text-lg leading-relaxed text-slate-600';

/** Section H2 inside editorial prose. */
export const MARKETING_EDITORIAL_H2 =
  'font-display text-2xl font-bold text-slate-900';
