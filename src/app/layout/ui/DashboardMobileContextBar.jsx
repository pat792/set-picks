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
 * min-height matches the tallest content (stepper ≈ 2rem + py-3).
 *
 * Scope controls (Tour Date / Tour) sit optically centered between the
 * title and a balancing empty column (#609).
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
  const hasScope = Boolean(showDatePicker) || Boolean(tourScope);

  return (
    <div className="grid min-h-[3.375rem] w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 bg-[rgb(var(--surface-chrome)_/_0.98)] px-4 py-3 shadow-[0_10px_26px_-18px_rgb(var(--brand-bg-deep)/0.9),0_0_24px_-16px_rgb(var(--brand-primary)/0.07)] backdrop-blur-sm supports-[backdrop-filter]:backdrop-saturate-125">
      <span
        className={`min-w-0 truncate text-sm font-bold ${
          isWarRoom
            ? dashboardMobileContextTitleWarRoomClasses
            : dashboardMobileContextTitleGradientClasses
        }`}
      >
        {contextTitle}
      </span>

      <div className="justify-self-center">
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

        {!hasScope ? <span className="sr-only">No scope control</span> : null}
      </div>

      {/* Balances the title column so the scope control stays optically centered. */}
      <div aria-hidden="true" className="min-w-0" />
    </div>
  );
}
