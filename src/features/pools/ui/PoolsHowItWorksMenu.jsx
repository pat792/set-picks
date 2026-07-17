import React from 'react';
import { ChevronDown } from 'lucide-react';

import DashboardRowPill from '../../../shared/ui/DashboardRowPill';
import PoolsHowItWorksBody from './PoolsHowItWorksBody';

/**
 * Native disclosure: top row is the action bar (leading + “How pools work”);
 * open content expands in normal flow below—no overlay or floating layer.
 *
 * @param {{ leading: React.ReactNode }} props
 */
export default function PoolsHowItWorksMenu({ leading }) {
  return (
    <details className="group w-full">
      <summary className="flex w-full cursor-pointer list-none items-start justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 shrink">{leading}</div>
        <DashboardRowPill as="span" tone="muted" className="shrink-0">
          How pools work
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </DashboardRowPill>
      </summary>
      <PoolsHowItWorksBody className="mt-2" />
    </details>
  );
}
