import React from 'react';

/**
 * Shown under the date picker when the selected date is after the current "next" show
 * (`getShowStatus` === FUTURE): picks for that night are not open until the previous show ends.
 */
export default function TooEarlyBanner() {
  return (
    <div
      className="mb-6 flex flex-col items-center justify-center rounded-2xl border border-slate-600/80 bg-slate-800/90 p-4 text-center shadow-lg md:flex-row md:gap-4 md:p-4 md:text-left"
      role="status"
    >
      <span className="mb-2 text-3xl md:mb-0" aria-hidden>
        ⏳
      </span>
      <div className="min-w-0">
        <h3 className="text-lg font-black italic tracking-tight text-white">Too early</h3>
        <p className="mt-1 text-sm font-bold leading-relaxed text-slate-400">
          Picks for this show will open after the previous show ends.
        </p>
      </div>
    </div>
  );
}
