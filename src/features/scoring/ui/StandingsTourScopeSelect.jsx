import React from 'react';

import {
  dashboardTourDateLabelGradientClasses,
  dashboardTourDateSelectChromeDesktopWrap,
  dashboardTourDateSelectChromeMobileWrap,
} from '../../../shared/config/dashboardHeadingTypography';

const LABEL = 'Tour';

/**
 * Tour scope selector for the Standings Tour view (#295 / #609) — same chrome
 * slot / centered treatment as Tour Date.
 *
 * Prev/next arrows are intentionally omitted: with only a couple of selectable
 * tours, stepping adds little over the select, and tour names aren’t a
 * day-by-day sequence. Revisit when the selectable list regularly exceeds ~3.
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

  const selectOrLabel = multiple ? (
    <select
      value={activeKey}
      onChange={(e) => onSelectTour(e.target.value)}
      aria-label="Select tour"
      className={
        variant === 'desktop'
          ? 'show-date-select w-full min-w-0 max-w-full cursor-pointer appearance-none rounded-[11px] border-0 bg-surface-field px-3 py-2.5 text-base font-bold text-white outline-none ring-0 transition-colors focus:border-transparent focus:ring-0'
          : 'show-date-select w-full min-w-0 max-w-full appearance-none rounded-[7px] border-0 bg-surface-field py-1.5 pl-2.5 pr-2 text-xs font-bold text-white outline-none ring-0 transition-colors cursor-pointer focus:border-transparent focus:ring-0'
      }
    >
      {tours.map((t) => (
        <option key={t.tour} value={t.tour}>
          {t.tour}
        </option>
      ))}
    </select>
  ) : (
    <span
      className={
        variant === 'desktop'
          ? 'block truncate px-3 py-2.5 text-center text-base font-bold text-white'
          : 'block max-w-[11.5rem] truncate text-center text-xs font-bold text-white'
      }
    >
      {activeKey}
    </span>
  );

  if (variant === 'desktop') {
    return (
      <div className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-border-muted/70 bg-surface-panel-strong p-3 shadow-inset-glass ring-1 ring-border-glass/45 backdrop-blur-md">
        <span
          className={`text-xs font-black uppercase tracking-widest ${dashboardTourDateLabelGradientClasses}`}
        >
          {LABEL}
        </span>
        <div className="w-full max-w-md">
          {multiple ? (
            <div className={dashboardTourDateSelectChromeDesktopWrap}>{selectOrLabel}</div>
          ) : (
            selectOrLabel
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5">
      <span
        className={`font-display text-[10px] font-semibold uppercase tracking-wide leading-none ${dashboardTourDateLabelGradientClasses}`}
      >
        {LABEL}
      </span>
      {multiple ? (
        <div
          className={`${dashboardTourDateSelectChromeMobileWrap} min-w-0 max-w-[11.5rem] sm:max-w-[14rem]`}
        >
          {selectOrLabel}
        </div>
      ) : (
        selectOrLabel
      )}
    </div>
  );
}
