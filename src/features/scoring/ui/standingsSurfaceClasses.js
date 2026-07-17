/**
 * Standings content-box geometry + type scale — aligned to Invite promo /
 * SponsorSlot shells (`rounded-xl`, ~`px-3.5 py-3.5`, title `text-sm`,
 * body `text-[11px]`). Colors stay per-surface; only shape + fonts are shared.
 */

/** Outer radius for every Standings content card/banner. */
export const STANDINGS_BOX_RADIUS = 'rounded-xl';

/** Even padding matching Invite promo (md bump matches invite md). */
export const STANDINGS_BOX_PAD = 'px-3.5 py-3.5 md:px-4 md:py-4';

/**
 * Card className override — force invite/sponsor radius + pad over Card
 * variant defaults (`rounded-2xl`/`3xl`, `p-4`–`p-8`).
 */
export const STANDINGS_CARD_SHELL = `!${STANDINGS_BOX_RADIUS} !p-3.5 md:!p-4`;

/** Primary title inside a Standings box (venue, setlist, empty-state heading). */
export const STANDINGS_BOX_TITLE =
  'text-sm font-bold leading-snug text-white md:text-base';

/** Secondary / body copy inside a Standings box. */
export const STANDINGS_BOX_BODY =
  'text-[11px] font-medium leading-snug text-content-secondary md:text-xs';

/** Uppercase eyebrow above a box title. */
export const STANDINGS_BOX_EYEBROW =
  'text-[10px] font-black uppercase tracking-widest';
