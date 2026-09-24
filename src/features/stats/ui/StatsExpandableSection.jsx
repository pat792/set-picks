import React from 'react';
import { ChevronDown } from 'lucide-react';

import InfoTooltip, {
  InfoTooltipProvider,
} from '../../../shared/ui/InfoTooltip';
import {
  DASHBOARD_CARD_PAD,
  DASHBOARD_CARD_RADIUS,
} from '../../../shared/ui/dashboardCardClasses';

/**
 * Expandable Personal Stats container (#1004).
 * Later insight tiles land as children — no new tertiary IA.
 *
 * @param {{
 *   title: string,
 *   hint?: string,
 *   hintLabel?: string,
 *   defaultOpen?: boolean,
 *   children: React.ReactNode,
 * }} props
 */
export default function StatsExpandableSection({
  title,
  hint,
  hintLabel,
  defaultOpen = true,
  children,
}) {
  const headingId = `stats-section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <InfoTooltipProvider>
      <details
        className={`group ${DASHBOARD_CARD_RADIUS} border border-border-subtle/55 bg-surface-panel/55 shadow-inset-glass ${DASHBOARD_CARD_PAD}`}
        defaultOpen={defaultOpen}
      >
        <summary className="flex list-none cursor-pointer items-center gap-2 text-left [&::-webkit-details-marker]:hidden">
          <h2
            id={headingId}
            className="text-sm font-black uppercase tracking-widest text-white"
          >
            {title}
          </h2>
          {hint ? (
            <InfoTooltip label={hintLabel || title} definition={hint} />
          ) : null}
          <ChevronDown
            className="ml-auto h-4 w-4 shrink-0 text-content-secondary transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="mt-3" role="region" aria-labelledby={headingId}>
          {children}
        </div>
      </details>
    </InfoTooltipProvider>
  );
}
