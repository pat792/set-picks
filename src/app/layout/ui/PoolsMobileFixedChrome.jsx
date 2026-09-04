import React from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp } from 'lucide-react';

import {
  NAV_LABEL_CREATE_POOL,
  NAV_LABEL_JOIN_POOL,
  NAV_LABEL_MY_POOLS,
} from '../../../shared/config/dashboardVocabulary';
import { POOLS_CLUSTER_PATHS } from '../../../shared/config/dashboardRoutes';
import { useDashboardMobileContextTrailingPortal } from '../../../shared/hooks/useDashboardMobileChromePortal';
import DashboardMobileChromeBar from '../../../shared/ui/DashboardMobileChromeBar';
import ChromeIconButton from '../../../shared/ui/ChromeIconButton';
import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';

const SUB_NAV = [
  { to: POOLS_CLUSTER_PATHS.list, label: NAV_LABEL_MY_POOLS, end: true },
  { to: POOLS_CLUSTER_PATHS.create, label: NAV_LABEL_CREATE_POOL, end: true },
  { to: POOLS_CLUSTER_PATHS.join, label: NAV_LABEL_JOIN_POOL, end: true },
];

/**
 * Mobile-only Pools tertiary chrome (#768) — fixed under the context bar.
 * Same My Pools / Create Pool / Join Pool tray as the in-page desktop nav.
 * How-pools-work CircleHelp portals into the context-bar trailing slot
 * (Standings Scale pattern) so it is not a fourth tertiary segment.
 *
 * @param {{ onOpenHowItWorks: () => void }} props
 */
export default function PoolsMobileFixedChrome({ onOpenHowItWorks }) {
  const trailingRoot = useDashboardMobileContextTrailingPortal();

  return (
    <>
      {trailingRoot
        ? createPortal(
            <ChromeIconButton
              icon={CircleHelp}
              label="How pools work"
              onClick={onOpenHowItWorks}
              size="sm"
            />,
            trailingRoot,
          )
        : null}

      <DashboardMobileChromeBar
        heading="Pools sections"
        headingId="pools-mobile-chrome-heading"
      >
        <ChromeSegmentedControl ariaLabel="Pools sections" items={SUB_NAV} />
      </DashboardMobileChromeBar>
    </>
  );
}
