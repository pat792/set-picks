import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Users } from 'lucide-react';

import DashboardMobileChromeBar from '../../../shared/ui/DashboardMobileChromeBar';
import DashboardRowPill from '../../../shared/ui/DashboardRowPill';

/**
 * @deprecated Use `src/app/layout/ui/PoolsMobileFixedChrome.jsx` (tertiary tray, #768).
 * Legacy “Go to Picks” + How-it-works tools band. Kept exported so in-flight
 * branches do not break while the cluster layout lands.
 *
 * Mobile-only Pools chrome (#609) — fixed under the context bar.
 *
 * @param {{
 *   isHowItWorksExpanded?: boolean,
 *   onToggleHowItWorks?: () => void,
 *   howItWorksContentId?: string,
 * }} props
 */
export default function PoolsMobileFixedChrome({
  isHowItWorksExpanded = false,
  onToggleHowItWorks,
  howItWorksContentId,
}) {
  return (
    <DashboardMobileChromeBar heading="Pools tools" headingId="pools-mobile-chrome-heading">
      <div className="flex items-center justify-between gap-2">
        <DashboardRowPill
          as={Link}
          to="/dashboard"
          tone="muted"
          className="shrink-0 text-brand-primary hover:text-brand-primary-strong"
        >
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Go to Picks
        </DashboardRowPill>
        <DashboardRowPill
          type="button"
          tone="muted"
          className="shrink-0"
          aria-expanded={isHowItWorksExpanded}
          aria-controls={howItWorksContentId}
          onClick={onToggleHowItWorks}
        >
          How pools work
          <ChevronDown
            className={[
              'h-3.5 w-3.5 shrink-0 transition-transform',
              isHowItWorksExpanded ? 'rotate-180' : '',
            ].join(' ')}
            aria-hidden
          />
        </DashboardRowPill>
      </div>
    </DashboardMobileChromeBar>
  );
}
