import {
  DASHBOARD_CARD_BODY,
  DASHBOARD_CARD_EYEBROW,
  DASHBOARD_CARD_EYEBROW_ICON,
  DASHBOARD_CARD_PAD,
  DASHBOARD_CARD_RADIUS,
  DASHBOARD_CARD_TITLE,
} from '../../../shared/ui/dashboardCardClasses';

/**
 * Scorecard chrome (#767) — related to StandingsSelfRecapCard geometry
 * (shared dashboard card tokens) but distinguished: stronger elevation,
 * thicker border, violet tertiary accent — not a teal recap clone.
 */
export const SCORECARD_SHELL = [
  'flex flex-col',
  DASHBOARD_CARD_RADIUS,
  'border-2 border-violet-400/35',
  'bg-surface-panel-strong',
  DASHBOARD_CARD_PAD,
  'shadow-lg shadow-black/30',
  'ring-1 ring-violet-400/25',
].join(' ');

export const SCORECARD_EYEBROW = `${DASHBOARD_CARD_EYEBROW} text-violet-300/90`;

export const SCORECARD_EYEBROW_ICON = `${DASHBOARD_CARD_EYEBROW_ICON} text-violet-300/90`;

export const SCORECARD_TITLE = DASHBOARD_CARD_TITLE;

export const SCORECARD_BODY = DASHBOARD_CARD_BODY;

export const SCORECARD_SLOT_LABEL =
  'text-[10px] font-black uppercase tracking-widest text-violet-300/75';

export const SCORECARD_METRIC =
  'text-[11px] font-semibold leading-snug text-content-secondary md:text-xs';

/** Default slot tile — used pre-grade and as the base under A5 rings. */
export const SCORECARD_SLOT_ITEM =
  'rounded-lg border border-violet-400/15 bg-surface-panel/40 px-3 py-2';

/** Soft A5 inset rings — lighter than Standings `ScoreBreakdownGrid` fills. */
export const SCORECARD_SLOT_RING = {
  primary: 'ring-1 ring-inset ring-brand-primary/35',
  in_setlist: 'ring-1 ring-inset ring-brand-accent-blue/35',
  amber: 'ring-1 ring-inset ring-amber-500/40',
};

export const SCORECARD_SLOT_CHECK = {
  primary: 'text-brand-primary',
  in_setlist: 'text-brand-accent-blue',
  amber: 'text-amber-400',
};

export const SCORECARD_SLOT_TITLE_TONE = {
  primary: 'text-brand-primary',
  in_setlist: 'text-brand-accent-blue',
  miss: 'text-content-secondary',
};
