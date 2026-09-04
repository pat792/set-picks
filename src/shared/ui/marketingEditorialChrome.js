/**
 * Marketing editorial chrome tokens (#944 / #968).
 *
 * Rule: editorial / SEO prose → light main; product / data → dark.
 * Viewport + type roles: `marketingEditorialViewport.css`.
 * Full chrome rule: `content/marketing/944-chrome-rule-review.md`.
 * Viewport process: `content/marketing/968-editorial-viewport-tokens.md`.
 */

/** Header bar height — `var(--header-height)` (5.35rem / sm 5.25rem). */
export const MARKETING_HEADER_HEIGHT = 'marketing-header-height';

/** Horizontal page gutter — `var(--page-gutter)` (1rem / sm 1.5rem / lg 2rem). */
export const MARKETING_PAGE_GUTTER_X = 'marketing-page-gutter-x';

/** Type role classes (light editorial only). */
export const MARKETING_EDITORIAL_TYPE_H1 = 'editorial-type-h1';
export const MARKETING_EDITORIAL_TYPE_LEDE = 'editorial-type-lede';
export const MARKETING_EDITORIAL_TYPE_BODY = 'editorial-type-body';
export const MARKETING_EDITORIAL_TYPE_META = 'editorial-type-meta';
export const MARKETING_EDITORIAL_TYPE_EYEBROW = 'editorial-type-eyebrow';

/** Full-bleed light article wrapper (HIW, keyword, About, marketing Scoring). */
export const MARKETING_EDITORIAL_ARTICLE =
  'marketing-editorial relative z-10 w-full bg-slate-50 py-16 md:py-24';

/** Centered reading column. */
export const MARKETING_EDITORIAL_COLUMN = `mx-auto w-full max-w-3xl ${MARKETING_PAGE_GUTTER_X}`;

/**
 * Optional eyebrow — keyword / definitional pages only.
 * Omit on HIW, About, Scoring unless the page is SEO-definitional.
 */
export const MARKETING_EDITORIAL_EYEBROW = `${MARKETING_EDITORIAL_TYPE_EYEBROW} mb-3 text-center font-black uppercase tracking-widest text-emerald-700`;

/** Page H1 — sentence case, slate on light paper. Space Grotesk display. */
export const MARKETING_EDITORIAL_H1 = `${MARKETING_EDITORIAL_TYPE_H1} mb-5 text-center font-display font-bold text-slate-900`;

/**
 * In-panel / inset H1 on light editorial surfaces (same size, left-aligned).
 * Used by marketing Scoring rules block.
 */
export const MARKETING_EDITORIAL_H1_INSET = `${MARKETING_EDITORIAL_TYPE_H1} mb-2 font-display font-bold text-slate-900`;

/** Supporting lede under H1. */
export const MARKETING_EDITORIAL_LEDE = `${MARKETING_EDITORIAL_TYPE_LEDE} mb-10 text-center leading-relaxed text-slate-600`;

/** Sentence body on light editorial (Inter). */
export const MARKETING_EDITORIAL_BODY = `${MARKETING_EDITORIAL_TYPE_BODY} leading-relaxed text-slate-700`;

/** Next-links, captions, and other meta on light editorial. */
export const MARKETING_EDITORIAL_META = `${MARKETING_EDITORIAL_TYPE_META} leading-relaxed text-slate-500`;

/** Section H2 inside editorial prose. */
export const MARKETING_EDITORIAL_H2 =
  'font-display text-2xl font-bold text-slate-900';

/**
 * Sibling card track — equal row height; pin actions with
 * `MARKETING_EDITORIAL_CARD_ACTION`. Do not pad shorter copy.
 */
export const MARKETING_EDITORIAL_CARD_TRACK =
  'grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 lg:gap-8';

export const MARKETING_EDITORIAL_CARD =
  'flex h-full flex-col items-center rounded-2xl bg-white p-6 text-center shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 md:items-start md:p-8 md:text-left';

/** Pin card CTA to the bottom of the shared track. */
export const MARKETING_EDITORIAL_CARD_ACTION = 'mt-auto pt-4';
