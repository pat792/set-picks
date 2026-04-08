import React from 'react';
import { Lock } from 'lucide-react';

/** Shown under the date picker when the user selects a past show date (all picker routes except Admin). */
export default function PastShowLockBanner() {
  return (
    <div
      className="mb-6 flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface-panel-strong p-4 text-center shadow-inset-glass md:flex-row md:gap-4 md:p-4 md:text-left"
      role="status"
    >
      <Lock
        className="mb-2 h-5 w-5 shrink-0 text-amber-500 md:mb-0"
        aria-hidden
      />
      <div className="min-w-0">
        <h3 className="font-display text-display-sm font-bold text-white">Picks Locked</h3>
        <p className="mt-1 text-sm font-bold leading-relaxed text-content-secondary">
          This show is in the past — picks can&apos;t be changed for this date.
        </p>
      </div>
    </div>
  );
}
