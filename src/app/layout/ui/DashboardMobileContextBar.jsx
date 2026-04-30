import React from 'react';
import {
  dashboardMobileContextTitleGradientClasses,
  dashboardMobileContextTitleWarRoomClasses,
  dashboardTourDateLabelGradientClasses,
  dashboardTourDateSelectChromeMobileWrap,
} from '../../../shared/config/dashboardHeadingTypography';
import { showOptionLabelCompact, showOptionTitle } from '../../../shared/utils/showOptionLabel.js';

export default function DashboardMobileContextBar({
  scrollDirection,
  contextTitle,
  contextTitleTone = 'default',
  showDatePicker,
  selectedDate,
  onSelectedDateChange,
  showDatesByTour,
}) {
  const isWarRoom = contextTitleTone === 'warRoom';
  return (
    <div
      className={`absolute top-full left-0 w-full bg-[rgb(var(--surface-chrome)_/_0.98)] backdrop-blur-sm supports-[backdrop-filter]:backdrop-saturate-125 shadow-[0_10px_26px_-18px_rgb(var(--brand-bg-deep)/0.9),0_0_24px_-16px_rgb(var(--brand-primary)/0.07)] px-4 py-3 flex flex-row flex-nowrap items-center justify-between gap-2 min-w-0 transition-transform duration-300 ease-in-out z-10 ${
        scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <span
        className={`min-w-0 flex-1 basis-0 truncate text-sm font-bold ${
          isWarRoom
            ? dashboardMobileContextTitleWarRoomClasses
            : dashboardMobileContextTitleGradientClasses
        }`}
      >
        {contextTitle}
      </span>

      {showDatePicker && (
        <div className="flex shrink-0 flex-row flex-nowrap items-center gap-1.5 min-w-0">
          <span
            className={`font-display text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap leading-none ${dashboardTourDateLabelGradientClasses}`}
          >
            Tour Date:
          </span>
          <div
            className={`${dashboardTourDateSelectChromeMobileWrap} shrink-0 max-w-[180px] min-w-0`}
          >
            <select
              value={selectedDate}
              onChange={(e) => onSelectedDateChange(e.target.value)}
              className="show-date-select w-full max-w-full min-w-0 appearance-none rounded-[7px] border-0 bg-surface-field py-1.5 pl-2.5 pr-2 text-xs font-bold text-white outline-none ring-0 transition-colors cursor-pointer focus:border-transparent focus:ring-0"
            >
            {showDatesByTour.map(({ tour, shows }, idx) => (
              <optgroup
                key={`${tour}-${shows[0]?.date ?? idx}`}
                label={tour}
                className="tour-optgroup"
              >
                {shows.map((show) => (
                  <option key={show.date} value={show.date} title={showOptionTitle(show)}>
                    {showOptionLabelCompact(show)}
                  </option>
                ))}
              </optgroup>
            ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

