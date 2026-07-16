import React from 'react';

import {
  dashboardTourDateLabelGradientClasses,
  dashboardTourDateSelectChromeDesktopWrap,
  dashboardTourDateSelectChromeMobileWrap,
} from '../../../shared/config/dashboardHeadingTypography';

/**
 * Tour scope selector for the Standings Tour view (#295 / #609) — same chrome
 * slot as Tour Date, single-row (label inline, not stacked).
 *
 * Prev/next arrows omitted: with only a couple of selectable tours, stepping
 * adds little over the select. Revisit when the list regularly exceeds ~3.
 *
 * @param {{
 *   variant: 'mobile' | 'desktop',
 *   tours: Array<{ tour: string }>,
 *   selectedTourKey: string | null | undefined,
 *   onSelectTour: (tourKey: string) => void,
 * }} props
 */
export default function StandingsTourScopeSelect({
  variant,
  tours,
  selectedTourKey,
  onSelectTour,
}) {
  if (!Array.isArray(tours) || tours.length === 0) return null;

  const activeKey = selectedTourKey ?? tours[0]?.tour ?? '';
  const multiple = tours.length > 1;

  if (variant === 'desktop') {
    return (
      <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-border-muted/70 bg-surface-panel-strong p-3 shadow-inset-glass ring-1 ring-border-glass/45 backdrop-blur-md">
        <span
          className={`shrink-0 px-2 text-xs font-black uppercase tracking-widest ${dashboardTourDateLabelGradientClasses}`}
        >
          Tour:
        </span>
        <div className="min-w-0 w-64 max-w-full shrink">
          {multiple ? (
            <div className={dashboardTourDateSelectChromeDesktopWrap}>
              <select
                value={activeKey}
                onChange={(e) => onSelectTour(e.target.value)}
                aria-label="Select tour"
                className="show-date-select w-full min-w-0 max-w-full cursor-pointer appearance-none rounded-[11px] border-0 bg-surface-field px-3 py-2.5 text-base font-bold text-white outline-none ring-0 transition-colors focus:border-transparent focus:ring-0"
              >
                {tours.map((t) => (
                  <option key={t.tour} value={t.tour}>
                    {t.tour}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="block truncate px-3 py-2.5 text-base font-bold text-white">
              {activeKey}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Mobile: same fixed width as Tour Date select so Show ↔ Tour doesn’t jump.
  return multiple ? (
    <div
      className={`${dashboardTourDateSelectChromeMobileWrap} min-w-0 w-[11rem] max-w-[11rem] shrink-0 sm:w-[12rem] sm:max-w-[12rem]`}
    >
      <select
        value={activeKey}
        onChange={(e) => onSelectTour(e.target.value)}
        aria-label="Select tour"
        className="show-date-select w-full min-w-0 max-w-full appearance-none rounded-[7px] border-0 bg-surface-field py-1.5 pl-2.5 pr-2 text-xs font-bold text-white outline-none ring-0 transition-colors cursor-pointer focus:border-transparent focus:ring-0"
      >
        {tours.map((t) => (
          <option key={t.tour} value={t.tour}>
            {t.tour}
          </option>
        ))}
      </select>
    </div>
  ) : (
    <span className="w-[11rem] max-w-[11rem] shrink-0 truncate text-center text-xs font-bold text-white sm:w-[12rem] sm:max-w-[12rem]">
      {activeKey}
    </span>
  );
}
