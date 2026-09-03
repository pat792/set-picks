import React from 'react';

import {
  NAV_LABEL_CREATE_POOL,
  NAV_LABEL_JOIN_POOL,
  NAV_LABEL_MY_POOLS,
} from '../../../shared/config/dashboardVocabulary';
import { POOLS_CLUSTER_PATHS } from '../../../shared/config/dashboardRoutes';
import DashboardMobileChromeBar from '../../../shared/ui/DashboardMobileChromeBar';
import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';

const SUB_NAV = [
  { to: POOLS_CLUSTER_PATHS.list, label: NAV_LABEL_MY_POOLS, end: true },
  { to: POOLS_CLUSTER_PATHS.create, label: NAV_LABEL_CREATE_POOL, end: true },
  { to: POOLS_CLUSTER_PATHS.join, label: NAV_LABEL_JOIN_POOL, end: true },
];

/**
 * Mobile-only Pools tertiary chrome (#768) — fixed under the context bar.
 * Same My Pools / Create Pool / Join Pool tray as the in-page desktop nav.
 */
export default function PoolsMobileFixedChrome() {
  return (
    <DashboardMobileChromeBar
      heading="Pools sections"
      headingId="pools-mobile-chrome-heading"
    >
      <ChromeSegmentedControl ariaLabel="Pools sections" items={SUB_NAV} />
    </DashboardMobileChromeBar>
  );
}
