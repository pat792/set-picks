import React from 'react';
import { Scale } from 'lucide-react';

import { NAV_LABEL_STANDINGS } from '../../../shared/config/dashboardVocabulary';
import { dashboardPageTitleGradientClasses } from '../../../shared/config/dashboardHeadingTypography';
import { InviteChooserTrigger } from '../../invite';
import StandingsViewToggle from './StandingsViewToggle';

/**
 * Mobile sticky offset under fixed brand + context bars (Standings · Tour Date).
 * Must match the *visual* bottom of that stack — not `main`’s looser `9rem`
 * content padding — or pills leave a scroll gap under the H2 row.
 *
 * Brand ≈ py-2 + mark (~4.95rem); context ≈ py-3 + select (~3.25rem) ≈ 8.2rem.
 */
export const STANDINGS_STICKY_MOBILE_TOP =
  'top-[calc(env(safe-area-inset-top,0px)+8.125rem)]';

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
 *   onOpenInvite?: () => void,
 *   pinBelowDesktopDatePicker?: boolean,
 * }} props
 */
export default function StandingsStickyChrome({
  view,
  onChange,
  onOpenScoringRules,
  onOpenInvite,
  pinBelowDesktopDatePicker = false,
}) {
  return (
    <div
      className={[
        'sticky z-20',
        // Flush under mobile Standings / Tour Date context bar.
        STANDINGS_STICKY_MOBILE_TOP,
        // Desktop: under sticky Tour Date when Show/Pools; flush when Tour (no date).
        pinBelowDesktopDatePicker ? 'md:top-[5.75rem]' : 'md:top-0',
        '-mx-4 px-4 md:-mx-8 md:px-8',
        'bg-brand-bg/90 py-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-brand-bg/75',
        'border-b border-border-subtle/35',
      ].join(' ')}
    >
      <h2
        className={`mb-3 mt-1 hidden font-display text-display-page font-bold tracking-tight md:mb-4 md:block md:text-display-page-lg ${dashboardPageTitleGradientClasses}`}
      >
        {NAV_LABEL_STANDINGS}
      </h2>

      <div className="relative">
        {onOpenInvite ? (
          <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2">
            <InviteChooserTrigger onClick={onOpenInvite} />
          </div>
        ) : null}
        {/* Always overlay so it never adds a second sticky tier above the pills. */}
        <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2">
          <button
            type="button"
            onClick={onOpenScoringRules}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-content-secondary transition-colors hover:bg-surface-panel hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg sm:px-3 sm:text-xs"
          >
            <Scale className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden min-[380px]:inline">Scoring rules</span>
            <span className="min-[380px]:hidden">Rules</span>
          </button>
        </div>

        <StandingsViewToggle
          view={view}
          onChange={onChange}
          className={[
            'mb-0',
            onOpenInvite ? 'pl-[4.75rem] pr-[4.5rem] min-[380px]:pr-[7.25rem]' : 'pr-[4.5rem] min-[380px]:pr-[7.25rem]',
          ].join(' ')}
        />
      </div>
    </div>
  );
}
