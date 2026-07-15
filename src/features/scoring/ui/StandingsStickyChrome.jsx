import React from 'react';
import { Scale } from 'lucide-react';

import { NAV_LABEL_STANDINGS } from '../../../shared/config/dashboardVocabulary';
import { dashboardPageTitleGradientClasses } from '../../../shared/config/dashboardHeadingTypography';
import StandingsViewToggle from './StandingsViewToggle';

/**
 * Sticky Standings page chrome: desktop title + Show/Tour/Pools (and Scoring rules).
 * Sits in the dashboard `main` scrollport so winner/setlist/leaderboard scroll under it.
 * Mobile keeps “Standings” in the fixed context bar — title is desktop-only here.
 *
 * Desktop `pinBelowDesktopDatePicker`: offset matches sticky Tour Date row in
 * `DashboardLayout` (`md:top-[5.75rem]`).
 *
 * @param {{
 *   view: 'show' | 'tour' | 'pools',
 *   onChange: (next: 'show' | 'tour' | 'pools') => void,
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
        'sticky z-20',
        // Mobile: sit below fixed brand + context bars (date lives in that stack).
        'top-[calc(env(safe-area-inset-top,0px)+9rem)]',
        // Desktop: under sticky Tour Date when Show/Pools; flush when Tour (no date).
        // 5.75rem ≈ sticky date shell (pt/pb + Tour Date card) — keep in sync with layout.
        pinBelowDesktopDatePicker ? 'md:top-[5.75rem]' : 'md:top-0',
        '-mx-4 px-4 md:-mx-8 md:px-8',
        'bg-brand-bg/90 pb-3 pt-1 backdrop-blur-md supports-[backdrop-filter]:bg-brand-bg/75',
        'border-b border-border-subtle/35',
      ].join(' ')}
    >
      <h2
        className={`mb-3 mt-1 hidden font-display text-display-page font-bold tracking-tight md:mb-4 md:block md:text-display-page-lg ${dashboardPageTitleGradientClasses}`}
      >
        {NAV_LABEL_STANDINGS}
      </h2>

      <div className="relative">
        <div className="mb-2 flex items-center justify-end md:absolute md:right-0 md:top-1/2 md:z-10 md:mb-0 md:-translate-y-1/2">
          <button
            type="button"
            onClick={onOpenScoringRules}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-content-secondary transition-colors hover:bg-surface-panel hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
          >
            <Scale className="h-3.5 w-3.5" aria-hidden />
            Scoring rules
          </button>
        </div>

        <StandingsViewToggle view={view} onChange={onChange} className="mb-0" />
      </div>
    </div>
  );
}
