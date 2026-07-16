import React from 'react';
import { CheckCircle2, ChevronDown, Lock, Scale } from 'lucide-react';

import DashboardMobileChromeBar from '../../../shared/ui/DashboardMobileChromeBar';
import ChromeIconButton from '../../../shared/ui/ChromeIconButton';
import GhostPill from '../../../shared/ui/GhostPill';

/**
 * Mobile-only Picks chrome (#609) — fixed under the context bar. Scale opens
 * scoring rules; optional status pill expands the in-flow status banner.
 *
 * @param {{
 *   onOpenScoringRules: () => void,
 *   shouldShowStatus?: boolean,
 *   shouldShowLockedStatus?: boolean,
 *   isStatusExpanded?: boolean,
 *   onToggleStatus?: () => void,
 *   statusContentId?: string,
 * }} props
 */
export default function PicksMobileFixedChrome({
  onOpenScoringRules,
  shouldShowStatus = false,
  shouldShowLockedStatus = false,
  isStatusExpanded = false,
  onToggleStatus,
  statusContentId,
}) {
  return (
    <DashboardMobileChromeBar heading="Picks tools" headingId="picks-mobile-chrome-heading">
      <div
        className={[
          'flex items-center gap-2',
          shouldShowStatus ? 'justify-between' : 'justify-end',
        ].join(' ')}
      >
        <ChromeIconButton icon={Scale} label="Scoring rules" onClick={onOpenScoringRules} />
        {shouldShowStatus ? (
          <GhostPill
            type="button"
            icon={shouldShowLockedStatus ? Lock : CheckCircle2}
            className={[
              shouldShowLockedStatus
                ? 'border-amber-500/35 bg-amber-500/10 text-amber-200/90 hover:border-amber-500/45 hover:bg-amber-500/15 hover:text-amber-100'
                : 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary hover:border-brand-primary/55 hover:bg-brand-primary/15 hover:text-brand-primary',
            ].join(' ')}
            aria-expanded={isStatusExpanded}
            aria-controls={statusContentId}
            onClick={onToggleStatus}
          >
            <span className="flex items-center gap-1">
              {shouldShowLockedStatus ? 'Picks locked' : 'Picks saved'}
              <ChevronDown
                className={[
                  'h-3.5 w-3.5 shrink-0 transition-transform',
                  isStatusExpanded ? 'rotate-180' : '',
                ].join(' ')}
                aria-hidden
              />
            </span>
          </GhostPill>
        ) : null}
      </div>
    </DashboardMobileChromeBar>
  );
}
