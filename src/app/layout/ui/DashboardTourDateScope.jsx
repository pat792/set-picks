import React from 'react';

import {
  dashboardTourDateLabelGradientClasses,
  dashboardTourDateSelectChromeDesktopWrap,
  dashboardTourDateSelectChromeMobileWrap,
} from '../../../shared/config/dashboardHeadingTypography';
import ChromeScopeStepper from '../../../shared/ui/ChromeScopeStepper';
import { adjacentScopeKeys } from '../../../shared/utils/adjacentScopeKeys';
import {
  showOptionLabelCompact,
  showOptionLabelDesktop,
  showOptionTitle,
} from '../../../shared/utils/showOptionLabel.js';

/**
 * Global Tour Date scope control (#609) — centered select with prev/next
 * arrows for seamless night-to-night stepping. Used in the mobile context
 * bar and the desktop sticky chrome row.
 *
 * @param {{
 *   variant: 'mobile' | 'desktop',
 *   selectedDate: string,
 *   onSelectedDateChange: (ymd: string) => void,
 *   showDates: Array<{ date: string }>,
 *   showDatesByTour: Array<{ tour: string, shows: Array<object> }>,
 * }} props
 */
export default function DashboardTourDateScope({
  variant,
  selectedDate,
  onSelectedDateChange,
  showDates,
  showDatesByTour,
}) {
  const { prevKey, nextKey } = adjacentScopeKeys(
    showDates,
    selectedDate,
    (s) => s.date,
  );

  const select = (
    <select
      value={selectedDate}
      onChange={(e) => onSelectedDateChange(e.target.value)}
      aria-label="Tour date"
      className={
        variant === 'desktop'
          ? 'show-date-select w-full min-w-0 max-w-full cursor-pointer appearance-none rounded-[11px] border-0 bg-surface-field px-3 py-2.5 text-base font-bold text-white outline-none ring-0 transition-colors focus:border-transparent focus:ring-0'
          : 'show-date-select w-full max-w-full min-w-0 appearance-none rounded-[7px] border-0 bg-surface-field py-1.5 pl-2.5 pr-2 text-xs font-bold text-white outline-none ring-0 transition-colors cursor-pointer focus:border-transparent focus:ring-0'
      }
    >
      {showDatesByTour.map(({ tour, shows }, idx) => (
        <optgroup
          key={`${tour}-${shows[0]?.date ?? idx}`}
          label={tour}
          className="tour-optgroup"
        >
          {shows.map((show) => (
            <option
              key={show.date}
              value={show.date}
              title={showOptionTitle(show)}
            >
              {variant === 'desktop'
                ? showOptionLabelDesktop(show)
                : showOptionLabelCompact(show)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  const stepper = (
    <ChromeScopeStepper
      size={variant === 'mobile' ? 'sm' : 'md'}
      canPrev={Boolean(prevKey)}
      canNext={Boolean(nextKey)}
      prevLabel="Previous show date"
      nextLabel="Next show date"
      onPrev={() => prevKey && onSelectedDateChange(prevKey)}
      onNext={() => nextKey && onSelectedDateChange(nextKey)}
      className={variant === 'desktop' ? 'w-full max-w-md' : 'min-w-0'}
    >
      <div
        className={
          variant === 'desktop'
            ? dashboardTourDateSelectChromeDesktopWrap
            : `${dashboardTourDateSelectChromeMobileWrap} min-w-0 max-w-[11.5rem] sm:max-w-[14rem]`
        }
      >
        {select}
      </div>
    </ChromeScopeStepper>
  );

  if (variant === 'desktop') {
    return (
      <div className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-border-muted/70 bg-surface-panel-strong p-3 shadow-inset-glass ring-1 ring-border-glass/45 backdrop-blur-md">
        <span
          className={`text-xs font-black uppercase tracking-widest ${dashboardTourDateLabelGradientClasses}`}
        >
          Tour Date
        </span>
        {stepper}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5">
      <span
        className={`font-display text-[10px] font-semibold uppercase tracking-wide leading-none ${dashboardTourDateLabelGradientClasses}`}
      >
        Tour Date
      </span>
      {stepper}
    </div>
  );
}
