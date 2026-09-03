import React from 'react';
import { ClipboardList } from 'lucide-react';

import {
  DASHBOARD_CARD_BODY,
  DASHBOARD_CARD_EYEBROW,
  DASHBOARD_CARD_EYEBROW_ICON,
  DASHBOARD_CARD_L2_MIN_H,
  DASHBOARD_CARD_PAD,
  DASHBOARD_CARD_RADIUS,
  DASHBOARD_CARD_TITLE,
} from '../../../shared/ui/dashboardCardClasses';

export const PICKS_SCORECARD_COMING_SOON_TITLE = 'Scorecard is coming soon';
export const PICKS_SCORECARD_COMING_SOON_BODY =
  'Show-by-show results will live here. Use Make Picks to lock your card for the selected night.';

/**
 * Scorecard cluster destination placeholder (#766). Metrics UI is a sibling.
 */
export default function PicksScorecardPlaceholder({ className = '' }) {
  const shellClass = `flex flex-col ${DASHBOARD_CARD_RADIUS} border border-border-subtle bg-surface-panel/60 ${DASHBOARD_CARD_PAD} ${className}`;

  return (
    <section
      className={`${shellClass} ${DASHBOARD_CARD_L2_MIN_H} justify-center`}
      aria-label="Scorecard"
    >
      <p
        className={`inline-flex items-center gap-1.5 ${DASHBOARD_CARD_EYEBROW} text-brand-primary`}
      >
        <ClipboardList className={DASHBOARD_CARD_EYEBROW_ICON} aria-hidden />
        Scorecard
      </p>
      <p className={`mt-1 ${DASHBOARD_CARD_TITLE}`}>{PICKS_SCORECARD_COMING_SOON_TITLE}</p>
      <p className={`mt-1 ${DASHBOARD_CARD_BODY}`}>{PICKS_SCORECARD_COMING_SOON_BODY}</p>
    </section>
  );
}
