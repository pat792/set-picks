import React from 'react';
import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

import { STATS_CLUSTER_PATHS } from '../../../shared/config/dashboardRoutes';
import {
  DASHBOARD_CARD_BODY,
  DASHBOARD_CARD_EYEBROW,
  DASHBOARD_CARD_EYEBROW_ICON,
  DASHBOARD_CARD_L2_MIN_H,
  DASHBOARD_CARD_PAD,
  DASHBOARD_CARD_RADIUS,
  DASHBOARD_CARD_TITLE,
} from '../../../shared/ui/dashboardCardClasses';

export const GLOBAL_STATS_COMING_SOON_TITLE = 'Global rankings are coming soon';
export const GLOBAL_STATS_COMING_SOON_BODY =
  'Leaderboards of the same individual stats you see on Personal — best to worst. Song frequency, bustouts, and high gaps live under Band.';

/**
 * Global Stats Phase 1 shell (#1004).
 * Honest rankings-coming placeholder — no song explorer, no self overlay.
 */
export default function GlobalStatsComingSoon({ className = '' }) {
  const shellClass = `flex flex-col ${DASHBOARD_CARD_RADIUS} border border-border-subtle bg-surface-panel/60 ${DASHBOARD_CARD_PAD} ${className}`;

  return (
    <section
      className={`${shellClass} ${DASHBOARD_CARD_L2_MIN_H} justify-center`}
      aria-label="Global Stats"
    >
      <p
        className={`inline-flex items-center gap-1.5 ${DASHBOARD_CARD_EYEBROW} text-brand-primary`}
      >
        <Trophy className={DASHBOARD_CARD_EYEBROW_ICON} aria-hidden />
        Global Stats
      </p>
      <p className={`mt-1 ${DASHBOARD_CARD_TITLE}`}>
        {GLOBAL_STATS_COMING_SOON_TITLE}
      </p>
      <p className={`mt-1 ${DASHBOARD_CARD_BODY}`}>
        {GLOBAL_STATS_COMING_SOON_BODY}
      </p>
      <Link
        to={STATS_CLUSTER_PATHS.band}
        className="mt-4 inline-flex items-center text-sm font-bold text-brand-primary hover:underline"
      >
        View Band Stats
      </Link>
    </section>
  );
}
