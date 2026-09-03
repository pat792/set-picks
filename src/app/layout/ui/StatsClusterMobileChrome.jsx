import React from 'react';

import {
  NAV_LABEL_BAND_STATS,
  NAV_LABEL_GLOBAL_STATS,
  NAV_LABEL_PERSONAL_STATS,
} from '../../../shared/config/dashboardVocabulary';
import { STATS_CLUSTER_PATHS } from '../../../shared/config/dashboardRoutes';
import DashboardMobileChromeBar from '../../../shared/ui/DashboardMobileChromeBar';
import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';

/**
 * Mobile-only Stats cluster chrome (#769) — fixed under the context bar.
 * Same Personal / Global / Band tray as the in-page desktop nav.
 *
 * @param {{
 *   items: Array<{
 *     to: string,
 *     label: string,
 *     end?: boolean,
 *     badge?: React.ReactNode,
 *     onClick?: (event: React.MouseEvent) => void,
 *   }>,
 * }} props
 */
export default function StatsClusterMobileChrome({ items }) {
  return (
    <DashboardMobileChromeBar
      heading="Stats sections"
      headingId="stats-cluster-mobile-chrome-heading"
    >
      <ChromeSegmentedControl ariaLabel="Stats sections" items={items} />
    </DashboardMobileChromeBar>
  );
}

/**
 * @param {string} personalTo
 * @param {{ badge?: React.ReactNode, onGlobalClick?: () => void }} [opts]
 */
export function buildStatsClusterNavItems(personalTo, opts = {}) {
  return [
    { to: personalTo, label: NAV_LABEL_PERSONAL_STATS, end: true },
    {
      to: STATS_CLUSTER_PATHS.global,
      label: NAV_LABEL_GLOBAL_STATS,
      end: true,
      badge: opts.badge ?? null,
      onClick: opts.onGlobalClick,
    },
    { to: STATS_CLUSTER_PATHS.band, label: NAV_LABEL_BAND_STATS, end: true },
  ];
}
