import React from 'react';
import { Music2 } from 'lucide-react';
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

export const BAND_STATS_COMING_SOON_TITLE = 'Band Stats is coming soon';
export const BAND_STATS_COMING_SOON_BODY =
  'Phish song stats by tour live under Global until we support more than one band.';

/**
 * Band Stats cluster destination placeholder (#769).
 * Does not duplicate the Global tour explorer.
 */
export default function BandStatsComingSoon({ className = '' }) {
  const shellClass = `flex flex-col ${DASHBOARD_CARD_RADIUS} border border-border-subtle bg-surface-panel/60 ${DASHBOARD_CARD_PAD} ${className}`;

  return (
    <section
      className={`${shellClass} ${DASHBOARD_CARD_L2_MIN_H} justify-center`}
      aria-label="Band Stats"
    >
      <p
        className={`inline-flex items-center gap-1.5 ${DASHBOARD_CARD_EYEBROW} text-brand-primary`}
      >
        <Music2 className={DASHBOARD_CARD_EYEBROW_ICON} aria-hidden />
        Band Stats
      </p>
      <p className={`mt-1 ${DASHBOARD_CARD_TITLE}`}>{BAND_STATS_COMING_SOON_TITLE}</p>
      <p className={`mt-1 ${DASHBOARD_CARD_BODY}`}>{BAND_STATS_COMING_SOON_BODY}</p>
      <Link
        to={STATS_CLUSTER_PATHS.global}
        className="mt-4 inline-flex items-center text-sm font-bold text-brand-primary hover:underline"
      >
        View Global Stats
      </Link>
    </section>
  );
}
