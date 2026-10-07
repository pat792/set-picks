import React from 'react';
import { Hourglass } from 'lucide-react';

import {
  DASHBOARD_CARD_BODY,
  DASHBOARD_CARD_TITLE,
} from '../../../shared/ui/dashboardCardClasses';
import DashboardJobShell from '../../../shared/ui/DashboardJobShell';

/** Waiting-for-setlist callout on Standings. Quiet notice, same shell as the other column cards. */
export default function StandingsBannerWaitingSetlist() {
  return (
    <DashboardJobShell
      tone="none"
      pad="row"
      className="mb-3 flex items-start gap-3"
      role="status"
      aria-label="Official setlist status"
    >
      <Hourglass
        className="mt-0.5 h-4 w-4 shrink-0 text-content-secondary"
        aria-hidden
      />
      <div className="min-w-0">
        <p className={DASHBOARD_CARD_TITLE}>Waiting for the setlist</p>
        <p className={`mt-0.5 ${DASHBOARD_CARD_BODY}`}>
          Follow the live setlist here when the show starts.
        </p>
      </div>
    </DashboardJobShell>
  );
}
