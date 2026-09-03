import React from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useLocation } from 'react-router-dom';

import { usePicksForm } from '../../../features/picks';
import { useShowCalendar } from '../../../features/show-calendar';
import {
  PICKS_CLUSTER_PATHS,
  isMakePicksPath,
  normalizeDashboardPathname,
} from '../../../shared/config/dashboardRoutes';
import { useDashboardMobileChromePortal } from '../../../shared/hooks/useDashboardMobileChromePortal';
import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';
import PicksClusterMobileChrome, {
  PICKS_CLUSTER_MOBILE_TOOLS_ROOT_ID,
  buildPicksClusterNavItems,
} from './PicksClusterMobileChrome';

/**
 * Persistent Picks-cluster sub-navigation (Make Picks / Picks Lab / Scorecard).
 * Nested routes render via {@link Outlet}.
 * Mobile: tertiary tray portals under the context bar (Profile cluster pattern).
 * Desktop: in-page tray at this call site — no md:-as-device assumptions in shared chrome.
 * Owns `usePicksForm` so Lab “Use” and Make Picks share one card across nested routes.
 *
 * @param {{
 *   user: import('firebase/auth').User | null | undefined,
 *   selectedDate: string,
 * }} props
 */
export default function PicksClusterLayout({ user, selectedDate }) {
  const location = useLocation();
  const mobileChromeRoot = useDashboardMobileChromePortal();
  const { showDates, showDatesByTour } = useShowCalendar();
  const picksForm = usePicksForm({ user, selectedDate, showDates, showDatesByTour });
  const makePicksTo = isMakePicksPath(location.pathname)
    ? normalizeDashboardPathname(location.pathname)
    : PICKS_CLUSTER_PATHS.makePicks;
  const items = buildPicksClusterNavItems(makePicksTo);

  return (
    <div className="max-w-xl mx-auto pb-6 md:pb-12">
      {mobileChromeRoot
        ? createPortal(
            <>
              <PicksClusterMobileChrome items={items} />
              <div id={PICKS_CLUSTER_MOBILE_TOOLS_ROOT_ID} />
            </>,
            mobileChromeRoot,
          )
        : null}

      <div className="mb-6 hidden md:block">
        <ChromeSegmentedControl ariaLabel="Picks sections" items={items} />
      </div>
      <Outlet context={{ user, selectedDate, picksForm }} />
    </div>
  );
}
