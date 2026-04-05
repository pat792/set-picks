import React from 'react';
import { SHOW_DATES_BY_TOUR } from '../../../shared/data/showDates.js';
import { showOptionLabelCompact, showOptionTitle } from '../../../shared/utils/showOptionLabel.js';

export default function DashboardMobileContextBar({
  scrollDirection,
  contextTitle,
  showDatePicker,
  selectedDate,
  onSelectedDateChange,
}) {
  return (
    <div
      className={`absolute top-full left-0 w-full bg-slate-800 border-b border-slate-700 px-4 py-3 flex flex-row flex-nowrap items-center justify-between gap-2 min-w-0 transition-transform duration-300 ease-in-out z-10 ${
        scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <span className="min-w-0 flex-1 basis-0 text-sm font-bold text-slate-200 truncate">
        {contextTitle}
      </span>

      {showDatePicker && (
        <div className="flex shrink-0 flex-row flex-nowrap items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap leading-none">
            Select Show:
          </span>
          <select
            value={selectedDate}
            onChange={(e) => onSelectedDateChange(e.target.value)}
            className="show-date-select shrink-0 max-w-[180px] min-w-0 appearance-none bg-slate-900 border border-slate-600 text-white text-xs font-bold py-1.5 px-2.5 rounded-lg outline-none focus:border-emerald-500 transition-colors cursor-pointer"
          >
            {SHOW_DATES_BY_TOUR.map(({ tour, shows }) => (
              <optgroup key={tour} label={tour} className="tour-optgroup">
                {shows.map((show) => (
                  <option key={show.date} value={show.date} title={showOptionTitle(show)}>
                    {showOptionLabelCompact(show)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

