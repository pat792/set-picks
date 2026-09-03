import React from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useLocation } from 'react-router-dom';

import { FeatureNewBadge, useFeatureSpotlight } from '../../../features/feature-discovery';
import {
  STATS_CLUSTER_PATHS,
  isPersonalStatsPath,
  normalizeDashboardPathname,
} from '../../../shared/config/dashboardRoutes';
import { useDashboardMobileChromePortal } from '../../../shared/hooks/useDashboardMobileChromePortal';
import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';
import StatsClusterMobileChrome, {
  buildStatsClusterNavItems,
} from './StatsClusterMobileChrome';

/**
 * Persistent Stats-cluster sub-navigation (Personal / Global / Band).
 * Nested routes render via {@link Outlet}.
 * Mobile: tertiary tray portals under the context bar (Profile cluster pattern).
 * Desktop: in-page tray at this call site — no md:-as-device assumptions in shared chrome.
 *
 * @param {{ user: import('firebase/auth').User | null | undefined }} props
 */
export default function StatsClusterLayout({ user }) {
  const location = useLocation();
  const mobileChromeRoot = useDashboardMobileChromePortal();
  const tourStatsSpotlight = useFeatureSpotlight('tour-stats');
  const personalTo = isPersonalStatsPath(location.pathname)
    ? normalizeDashboardPathname(location.pathname)
    : STATS_CLUSTER_PATHS.root;
  const items = buildStatsClusterNavItems(personalTo, {
    badge: tourStatsSpotlight.active ? (
      <FeatureNewBadge variant="dot" title="New: Tour Stats" />
    ) : null,
    onGlobalClick: tourStatsSpotlight.active
      ? () => tourStatsSpotlight.trackClick()
      : undefined,
  });

  return (
    <div className="max-w-xl mx-auto pb-6 md:pb-12">
      {mobileChromeRoot
        ? createPortal(<StatsClusterMobileChrome items={items} />, mobileChromeRoot)
        : null}

      <div className="mb-6 hidden md:block">
        <ChromeSegmentedControl ariaLabel="Stats sections" items={items} />
      </div>
      <Outlet context={{ user }} />
    </div>
  );
}
