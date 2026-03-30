import React from 'react';

/** Shown under the date picker when the user selects a past show date (all picker routes except Admin). */
export default function PastShowLockBanner() {
  return (
    <div
      className="mb-6 flex flex-col items-center justify-center rounded-2xl border border-slate-600/80 bg-slate-800/90 p-4 text-center shadow-lg md:flex-row md:gap-4 md:p-4 md:text-left"
      role="status"
    >
      <span className="mb-2 text-3xl md:mb-0" aria-hidden>
        🔒
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-display-sm font-bold text-white">Picks Locked</h3>
        <p className="mt-1 text-sm font-bold leading-relaxed text-slate-400">
          This show has already happened! Practice Mode is coming soon.
        </p>
      </div>
    </div>
  );
}
