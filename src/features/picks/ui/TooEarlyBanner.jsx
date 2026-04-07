import React from 'react';
import { Hourglass } from 'lucide-react';

/**
 * Shown under the date picker when the selected date is after the current "next" show
 * (`getShowStatus` === FUTURE): picks for that night are not open until the previous show ends.
 *
 * @param {{ priorShowLabel?: string | null }} props
 */
export default function TooEarlyBanner({ priorShowLabel = null }) {
  const detail =
    priorShowLabel != null && priorShowLabel !== ''
      ? `Picks open after ${priorShowLabel} ends.`
      : 'Picks for this show open after the previous night on the tour ends.';

  return (
    <div
      className="mb-6 flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface-panel-strong p-4 text-center shadow-inset-glass md:flex-row md:gap-4 md:p-4 md:text-left"
      role="status"
    >
      <Hourglass
        className="mb-2 h-5 w-5 shrink-0 text-slate-400 md:mb-0"
        aria-hidden
      />
      <div className="min-w-0">
        <h3 className="font-display text-display-sm font-bold text-white">Too early</h3>
        <p className="mt-1 text-sm font-bold leading-relaxed text-slate-400">{detail}</p>
      </div>
    </div>
  );
}
