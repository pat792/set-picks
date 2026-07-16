import React from 'react';
import { Scale } from 'lucide-react';

import DashboardMobileChromeBar from '../../../shared/ui/DashboardMobileChromeBar';
import ChromeIconButton from '../../../shared/ui/ChromeIconButton';
import StandingsViewToggle from './StandingsViewToggle';

/**
 * Mobile-only Standings views chrome (#609) — fixed in the dashboard mobile
 * header stack directly under the context bar. Portaled via
 * `useDashboardMobileChromePortal`.
 *
 * @param {{
 *   view: 'show' | 'tour' | 'pools',
 *   onChange: (next: 'show' | 'tour' | 'pools') => void,
 *   onOpenScoringRules: () => void,
 * }} props
 */
export default function StandingsMobileFixedChrome({
  view,
  onChange,
  onOpenScoringRules,
}) {
  return (
    <DashboardMobileChromeBar
      heading="Standings views"
      headingId="standings-views-heading"
    >
      <div className="flex items-center gap-2">
        <StandingsViewToggle
          view={view}
          onChange={onChange}
          className="mb-0 min-w-0 flex-1"
        />
        <ChromeIconButton icon={Scale} label="Scoring rules" onClick={onOpenScoringRules} />
      </div>
    </DashboardMobileChromeBar>
  );
}
