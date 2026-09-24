import React from 'react';
import { FlaskConical } from 'lucide-react';

import {
  DASHBOARD_CARD_BODY,
  DASHBOARD_CARD_EYEBROW,
  DASHBOARD_CARD_EYEBROW_ICON,
  DASHBOARD_CARD_L2_MIN_H,
  DASHBOARD_CARD_PAD,
  DASHBOARD_CARD_RADIUS,
  DASHBOARD_CARD_TITLE,
} from '../../../shared/ui/dashboardCardClasses';

export const PICKS_LAB_COMING_SOON_TITLE = 'Picks Lab is coming soon';
export const PICKS_LAB_COMING_SOON_BODY =
  'Slot-aware recommendations will live here. The Lab tab stays visible so you can find it later.';

/**
 * Empty / coming-soon shell when Prediction Lab is flag-off (#766).
 * The tertiary Lab segment stays visible; this is the destination body.
 */
export default function PicksLabComingSoon({ className = '' }) {
  const shellClass = `flex flex-col ${DASHBOARD_CARD_RADIUS} border border-border-subtle bg-surface-panel/60 ${DASHBOARD_CARD_PAD} ${className}`;

  return (
    <section
      className={`${shellClass} ${DASHBOARD_CARD_L2_MIN_H} justify-center`}
      aria-label="Picks Lab"
    >
      <p
        className={`inline-flex items-center gap-1.5 ${DASHBOARD_CARD_EYEBROW} text-brand-primary`}
      >
        <FlaskConical className={DASHBOARD_CARD_EYEBROW_ICON} aria-hidden />
        Picks Lab
      </p>
      <p className={`mt-1 ${DASHBOARD_CARD_TITLE}`}>{PICKS_LAB_COMING_SOON_TITLE}</p>
      <p className={`mt-1 ${DASHBOARD_CARD_BODY}`}>{PICKS_LAB_COMING_SOON_BODY}</p>
    </section>
  );
}
