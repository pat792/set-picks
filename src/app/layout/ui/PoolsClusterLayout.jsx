import React from 'react';
import { createPortal } from 'react-dom';
import { Outlet } from 'react-router-dom';

import {
  NAV_LABEL_CREATE_POOL,
  NAV_LABEL_JOIN_POOL,
  NAV_LABEL_MY_POOLS,
} from '../../../shared/config/dashboardVocabulary';
import { POOLS_CLUSTER_PATHS } from '../../../shared/config/dashboardRoutes';
import { useDashboardMobileChromePortal } from '../../../shared/hooks/useDashboardMobileChromePortal';
import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';
import { PoolsHowItWorksMenu } from '../../../features/pools';
import PoolsMobileFixedChrome from './PoolsMobileFixedChrome';

const SUB_NAV = [
  { to: POOLS_CLUSTER_PATHS.list, label: NAV_LABEL_MY_POOLS, end: true },
  { to: POOLS_CLUSTER_PATHS.create, label: NAV_LABEL_CREATE_POOL, end: true },
  { to: POOLS_CLUSTER_PATHS.join, label: NAV_LABEL_JOIN_POOL, end: true },
];

/**
 * Persistent Pools-cluster tertiary nav (My Pools / Create Pool / Join Pool).
 * Nested routes render via {@link Outlet}; `user` is passed through outlet context.
 * Mobile: tertiary tray is fixed under the context bar (Profile chrome pattern).
 * How-it-works stays a disclosure — not a fourth tertiary segment (#768).
 *
 * @param {{ user: import('firebase/auth').User | null | undefined }} props
 */
export default function PoolsClusterLayout({ user }) {
  const mobileChromeRoot = useDashboardMobileChromePortal();

  return (
    <div className="w-full pb-6 md:pb-12">
      {mobileChromeRoot
        ? createPortal(<PoolsMobileFixedChrome />, mobileChromeRoot)
        : null}

      <div className="mb-6 hidden md:block">
        <ChromeSegmentedControl ariaLabel="Pools sections" items={SUB_NAV} />
      </div>

      <div className="mb-6">
        <PoolsHowItWorksMenu />
      </div>

      <Outlet context={{ user }} />
    </div>
  );
}
