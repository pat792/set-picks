import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import Card from '../../../shared/ui/Card';
import {
  STANDINGS_BOX_RADIUS,
  STANDINGS_BOX_TITLE,
  STANDINGS_CARD_SHELL,
} from './standingsSurfaceClasses';

/**
 * Waiting-for-setlist callout on Standings. Mobile-first: thin strip with
 * optional expand so the leaderboard stays near the fold (#317). Desktop
 * keeps the full alert card. Chevron flips and the whole strip toggles
 * expand/collapse (same pattern as Picks locked / How pools work).
 */
export default function StandingsBannerWaitingSetlist() {
  const panelId = useId();
  const [open, setOpen] = useState(false);

  const copy = 'Waiting for official setlist. Stay tuned...';

  return (
    <div className="mb-3 md:mb-6">
      <div className="md:hidden">
        <button
          type="button"
          className={[
            `flex w-full items-center justify-between gap-2 ${STANDINGS_BOX_RADIUS} border border-amber-500/35 bg-amber-950/25 px-3.5 py-3.5 text-left transition-colors hover:border-amber-400/45 hover:bg-amber-950/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60`,
            open ? 'rounded-b-none border-b-transparent' : '',
          ].join(' ')}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <p className={`${STANDINGS_BOX_TITLE} text-amber-400`}>{copy}</p>
          <ChevronDown
            className={[
              'h-4 w-4 shrink-0 text-amber-300/90 transition-transform',
              open ? 'rotate-180' : '',
            ].join(' ')}
            aria-hidden
          />
        </button>
        {open ? (
          <Card
            id={panelId}
            variant="alert"
            padding="none"
            className={`${STANDINGS_CARD_SHELL} !rounded-t-none border-t-0 text-center`}
            role="region"
            aria-label="Official setlist status"
          >
            <p className={`${STANDINGS_BOX_TITLE} text-amber-400`}>{copy}</p>
          </Card>
        ) : null}
      </div>

      <div className="hidden md:block">
        <Card
          variant="alert"
          padding="none"
          className={`${STANDINGS_CARD_SHELL} text-center`}
        >
          <p className={`${STANDINGS_BOX_TITLE} text-amber-400`}>{copy}</p>
        </Card>
      </div>
    </div>
  );
}
