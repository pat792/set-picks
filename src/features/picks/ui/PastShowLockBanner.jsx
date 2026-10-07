import React from 'react';
import { Lock } from 'lucide-react';

import { DASHBOARD_CARD_BODY } from '../../../shared/ui/dashboardCardClasses';
import DashboardJobShell from '../../../shared/ui/DashboardJobShell';

/** Shown under the date picker when the user selects a past show date (all picker routes except Admin). */
export default function PastShowLockBanner() {
  return (
    <DashboardJobShell
      tone="none"
      pad="row"
      className="mb-6 flex items-start gap-3"
      role="status"
    >
      <Lock
        className="mt-0.5 h-4 w-4 shrink-0 text-content-secondary"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-[11px] font-bold leading-snug text-white md:text-xs">Picks locked</p>
        <p className={`mt-0.5 ${DASHBOARD_CARD_BODY}`}>
          This show is in the past — picks can&apos;t be changed for this date.
        </p>
      </div>
    </DashboardJobShell>
  );
}
