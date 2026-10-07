import React from 'react';
import { Hourglass } from 'lucide-react';

import { DASHBOARD_CARD_BODY } from '../../../shared/ui/dashboardCardClasses';
import DashboardJobShell from '../../../shared/ui/DashboardJobShell';

/**
 * Shown under the date picker when the selected date is after the current "next" show
 * (`getShowStatus` === FUTURE): picks for that night are not open until the previous show ends.
 *
 * @param {{ priorShowLabel?: string | null }} props
 */
export default function TooEarlyBanner({ priorShowLabel = null }) {
  const detail =
    priorShowLabel != null && priorShowLabel !== ''
      ? `Picks open after ${priorShowLabel} ends.`
      : 'Picks for this show open after the previous night on the tour ends.';

  return (
    <DashboardJobShell
      tone="none"
      pad="row"
      className="mb-6 flex items-start gap-3"
      role="status"
    >
      <Hourglass
        className="mt-0.5 h-4 w-4 shrink-0 text-content-secondary"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-[11px] font-bold leading-snug text-white md:text-xs">Too early</p>
        <p className={`mt-0.5 ${DASHBOARD_CARD_BODY}`}>{detail}</p>
      </div>
    </DashboardJobShell>
  );
}
