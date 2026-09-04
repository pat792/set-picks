import React from 'react';
import { createPortal } from 'react-dom';
import { Outlet } from 'react-router-dom';

import {
  NAV_LABEL_ACCOUNT,
  NAV_LABEL_MESSAGES,
  NAV_LABEL_PREFERENCES,
  NAV_LABEL_PROFILE,
} from '../../../shared/config/dashboardVocabulary';
import { PROFILE_CLUSTER_PATHS } from '../../../shared/config/dashboardRoutes';
import {
  useDashboardDesktopPageChromePortal,
  useDashboardMobileChromePortal,
} from '../../../shared/hooks/useDashboardMobileChromePortal';
import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';
import DashboardStickyPageChrome from '../../../shared/ui/DashboardStickyPageChrome';
import ProfileMobileFixedChrome from './ProfileMobileFixedChrome';

const SUB_NAV = [
  { to: PROFILE_CLUSTER_PATHS.profile, label: NAV_LABEL_PROFILE, end: true },
  { to: PROFILE_CLUSTER_PATHS.notifications, label: NAV_LABEL_MESSAGES, end: true },
  { to: PROFILE_CLUSTER_PATHS.account, label: NAV_LABEL_PREFERENCES, end: true },
];

/**
 * Persistent Account-cluster sub-navigation (Profile / Messages / Preferences).
 * Nested routes render via {@link Outlet}; `user` is passed through outlet context.
 * Mobile: sub-nav is fixed under the context bar (Standings chrome pattern).
 * Desktop: title + tray portaled into the layout sticky stack.
 *
 * @param {{ user: import('firebase/auth').User | null | undefined }} props
 */
export default function ProfileClusterLayout({ user }) {
  const mobileChromeRoot = useDashboardMobileChromePortal();
  const desktopChromeRoot = useDashboardDesktopPageChromePortal();

  return (
    <div className="max-w-xl mx-auto pb-6 md:pb-12">
      {mobileChromeRoot
        ? createPortal(<ProfileMobileFixedChrome />, mobileChromeRoot)
        : null}

      {desktopChromeRoot
        ? createPortal(
            <DashboardStickyPageChrome title={NAV_LABEL_ACCOUNT}>
              <ChromeSegmentedControl ariaLabel="Account sections" items={SUB_NAV} />
            </DashboardStickyPageChrome>,
            desktopChromeRoot,
          )
        : null}
      <Outlet context={{ user }} />
    </div>
  );
}
