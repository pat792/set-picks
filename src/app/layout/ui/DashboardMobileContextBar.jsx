import React from 'react';

import {
  dashboardMobileContextTitleGradientClasses,
  dashboardMobileContextTitleWarRoomClasses,
} from '../../../shared/config/dashboardHeadingTypography';
import { StandingsTourScopeSelect } from '../../../features/scoring';
import DashboardTourDateScope from './DashboardTourDateScope';

/**
 * Uniform row height across tabs: routes without a scope select
 * (Profile cluster, pool hub) would otherwise render a shorter bar, so the
 * min-height matches the tallest content (select ≈ 1.875rem + py-3).
 *
 * Title left, scope control right — single row (no stacked labels) (#609).
 */
export default function DashboardMobileContextBar({
  contextTitle,
  contextTitleTone = 'default',
  showDatePicker,
  selectedDate,
  onSelectedDateChange,
  showDates,
  showDatesByTour,
  tourScope = null,
}) {
  const isWarRoom = contextTitleTone === 'warRoom';

  return (
    <div className="flex min-h-[3.375rem] w-full min-w-0 flex-row flex-nowrap items-center justify-between gap-2 bg-[rgb(var(--surface-chrome)_/_0.98)] px-4 py-3 shadow-[0_10px_26px_-18px_rgb(var(--brand-bg-deep)/0.9),0_0_24px_-16px_rgb(var(--brand-primary)/0.07)] backdrop-blur-sm supports-[backdrop-filter]:backdrop-saturate-125">
      <span
        className={`min-w-0 flex-1 basis-0 truncate text-sm font-bold ${
          isWarRoom
            ? dashboardMobileContextTitleWarRoomClasses
            : dashboardMobileContextTitleGradientClasses
        }`}
      >
        {contextTitle}
      </span>

      {showDatePicker ? (
        <DashboardTourDateScope
          variant="mobile"
          selectedDate={selectedDate}
          onSelectedDateChange={onSelectedDateChange}
          showDates={showDates}
          showDatesByTour={showDatesByTour}
        />
      ) : null}

      {tourScope ? (
        <StandingsTourScopeSelect
          variant="mobile"
          tours={tourScope.tours}
          selectedTourKey={tourScope.selectedTourKey}
          onSelectTour={tourScope.onSelectTour}
        />
      ) : null}
    </div>
  );
}
