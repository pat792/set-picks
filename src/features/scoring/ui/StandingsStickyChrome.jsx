import React from 'react';
import { Scale } from 'lucide-react';

import { NAV_LABEL_STANDINGS } from '../../../shared/config/dashboardVocabulary';
import DashboardStickyPageChrome from '../../../shared/ui/DashboardStickyPageChrome';
import StandingsViewToggle from './StandingsViewToggle';

/**
 * Desktop Standings page chrome: title + Show/Tour/Pools tray + Scoring rules.
 * Portaled into the layout sticky stack (`DashboardStickyChromeStack`).
 * Invite lives in-flow as {@link StandingsInvitePromo} (mirrors mobile).
 *
 * Mobile views chrome lives in the fixed header stack as
 * {@link StandingsMobileFixedChrome} (#609) — this component is desktop
 * portal content only.
 *
 * @param {{
 *   view: 'show' | 'tour' | 'pools',
 *   onChange: (next: 'show' | 'tour' | 'pools') => void,
 *   onOpenScoringRules: () => void,
 * }} props
 */
export default function StandingsStickyChrome({
  view,
  onChange,
  onOpenScoringRules,
}) {
  return (
    <DashboardStickyPageChrome
      title={NAV_LABEL_STANDINGS}
      trailing={
        <button
          type="button"
          onClick={onOpenScoringRules}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-content-secondary transition-colors hover:bg-surface-panel hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        >
          <Scale className="h-3.5 w-3.5" aria-hidden />
          Scoring rules
        </button>
      }
    >
      <StandingsViewToggle
        view={view}
        onChange={onChange}
        className="mb-0 min-w-0 flex-1"
      />
    </DashboardStickyPageChrome>
  );
}
