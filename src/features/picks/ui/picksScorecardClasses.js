import {
  DASHBOARD_CARD_BODY,
  DASHBOARD_CARD_EYEBROW,
  DASHBOARD_CARD_TITLE,
} from '../../../shared/ui/dashboardCardClasses';

/**
 * Scorecard type (#1088). The box is `DashboardJobShell` tone `amber`
 * (you). Slot hit rings stay semantic; they are not a violet card border.
 */
export const SCORECARD_EYEBROW = `${DASHBOARD_CARD_EYEBROW} text-amber-200/90`;

export const SCORECARD_EYEBROW_ICON = 'h-3.5 w-3.5 shrink-0 text-amber-200/90';

export const SCORECARD_TITLE = DASHBOARD_CARD_TITLE;

export const SCORECARD_BODY = DASHBOARD_CARD_BODY;

export const SCORECARD_SLOT_LABEL =
  'text-[10px] font-black uppercase tracking-widest text-content-secondary/70';

export const SCORECARD_METRIC =
  'text-[11px] font-semibold leading-snug text-content-secondary md:text-xs';

/** Default slot tile — used pre-grade and as the base under A5 rings. */
export const SCORECARD_SLOT_ITEM =
  'rounded-lg border border-border-subtle/60 bg-surface-panel/40 px-3 py-2';

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
