import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp } from 'lucide-react';
import { Outlet } from 'react-router-dom';

import {
  NAV_LABEL_CREATE_POOL,
  NAV_LABEL_JOIN_POOL,
  NAV_LABEL_MY_POOLS,
} from '../../../shared/config/dashboardVocabulary';
import { POOLS_CLUSTER_PATHS } from '../../../shared/config/dashboardRoutes';
import { useDashboardMobileChromePortal } from '../../../shared/hooks/useDashboardMobileChromePortal';
import ChromeIconButton from '../../../shared/ui/ChromeIconButton';
import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';
import { PoolsHowItWorksModal } from '../../../features/pools';
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
 * How-it-works is a context-bar / tray-adjacent icon (Standings Scale), not a
 * fourth tertiary segment or in-flow disclosure.
 *
 * @param {{ user: import('firebase/auth').User | null | undefined }} props
 */
export default function PoolsClusterLayout({ user }) {
  const mobileChromeRoot = useDashboardMobileChromePortal();
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const openHowItWorks = useCallback(() => setHowItWorksOpen(true), []);
  const closeHowItWorks = useCallback(() => setHowItWorksOpen(false), []);

  return (
    <div className="w-full pb-6 md:pb-12">
      {mobileChromeRoot
        ? createPortal(
            <PoolsMobileFixedChrome onOpenHowItWorks={openHowItWorks} />,
            mobileChromeRoot,
          )
        : null}

      <div className="mb-6 hidden items-center justify-between gap-4 md:flex">
        <ChromeSegmentedControl
          ariaLabel="Pools sections"
          items={SUB_NAV}
          className="min-w-0 flex-1"
        />
        <ChromeIconButton
          icon={CircleHelp}
          label="How pools work"
          onClick={openHowItWorks}
          size="sm"
        />
      </div>

      <PoolsHowItWorksModal open={howItWorksOpen} onClose={closeHowItWorks} />

      <Outlet context={{ user }} />
    </div>
  );
}
