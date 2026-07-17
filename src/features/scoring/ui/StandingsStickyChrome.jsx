import React from 'react';
import { Scale } from 'lucide-react';

import { NAV_LABEL_STANDINGS } from '../../../shared/config/dashboardVocabulary';
import { dashboardPageTitleGradientClasses } from '../../../shared/config/dashboardHeadingTypography';
import StandingsViewToggle from './StandingsViewToggle';

/**
 * Desktop Standings page chrome: title + Show/Tour/Stats/Pools + Scoring rules.
 * Sticky in the dashboard `main` scrollport under the Tour Date / Tour scope row.
 * Invite lives in-flow as {@link StandingsInvitePromo} (mirrors mobile).
 *
 * Mobile views chrome lives in the fixed header stack as
 * {@link StandingsMobileFixedChrome} (#609) — this component is `md+` only.
 *
 * Desktop `pinBelowDesktopDatePicker`: offset matches sticky Tour Date row in
 * `DashboardLayout` (`md:top-[5.75rem]`).
 *
 * @param {{
 *   view: 'show' | 'tour' | 'pools' | 'stats',
 *   onChange: (next: 'show' | 'tour' | 'pools' | 'stats') => void,
 *   onOpenScoringRules: () => void,
 *   pinBelowDesktopDatePicker?: boolean,
 * }} props
 */
export default function StandingsStickyChrome({
  view,
  onChange,
  onOpenScoringRules,
  pinBelowDesktopDatePicker = false,
}) {
  return (
    <div
      className={[
        'sticky z-20 hidden md:block',
        pinBelowDesktopDatePicker ? 'md:top-[5.75rem]' : 'md:top-0',
        '-mx-4 px-4 md:-mx-8 md:px-8',
        'bg-brand-bg/90 py-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-brand-bg/75',
        'border-b border-border-subtle/35',
      ].join(' ')}
    >
      <h2
        className={`mb-3 mt-1 font-display text-display-page font-bold tracking-tight md:mb-4 md:text-display-page-lg ${dashboardPageTitleGradientClasses}`}
      >
        {NAV_LABEL_STANDINGS}
      </h2>

      <div className="flex items-center justify-between gap-4">
        <StandingsViewToggle
          view={view}
          onChange={onChange}
          className="mb-0 w-auto flex-none"
        />

        <button
          type="button"
          onClick={onOpenScoringRules}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-content-secondary transition-colors hover:bg-surface-panel hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        >
          <Scale className="h-3.5 w-3.5" aria-hidden />
          Scoring rules
        </button>
      </div>
    </div>
  );
}
