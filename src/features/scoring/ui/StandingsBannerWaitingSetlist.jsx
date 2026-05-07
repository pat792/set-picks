import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import Card from '../../../shared/ui/Card';

/**
 * Waiting-for-setlist callout on Standings. Mobile-first: thin strip with
 * optional expand so the leaderboard stays near the fold (#317). Desktop
 * keeps the full alert card.
 */
export default function StandingsBannerWaitingSetlist() {
  const panelId = useId();
  const [open, setOpen] = useState(false);

  const copy = 'Waiting for official setlist. Stay tuned...';

  return (
    <div className="mb-3 md:mb-6">
      <div className="md:hidden">
        {!open ? (
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-amber-500/35 bg-amber-950/25 px-3 py-2 text-left transition-colors hover:border-amber-400/45 hover:bg-amber-950/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
            aria-expanded={false}
            aria-controls={panelId}
            onClick={() => setOpen(true)}
          >
            <p className="text-xs font-bold text-amber-400">{copy}</p>
            <ChevronDown className="h-4 w-4 shrink-0 text-amber-300/90" aria-hidden />
          </button>
        ) : (
          <Card
            id={panelId}
            variant="alert"
            padding="sm"
            className="text-center"
            role="region"
            aria-label="Official setlist status"
          >
            <p className="text-sm font-bold text-amber-400">{copy}</p>
            <button
              type="button"
              className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-amber-200/90 hover:text-amber-100"
              onClick={() => setOpen(false)}
            >
              Collapse
            </button>
          </Card>
        )}
      </div>

      <div className="hidden md:block">
        <Card variant="alert" padding="sm" className="text-center">
          <p className="text-sm font-bold text-amber-400">{copy}</p>
        </Card>
      </div>
    </div>
  );
}
