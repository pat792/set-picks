import React from 'react';
import { createPortal } from 'react-dom';
import { Outlet } from 'react-router-dom';

import {
  NAV_LABEL_ACCOUNT,
  NAV_LABEL_MESSAGES,
  NAV_LABEL_PROFILE,
} from '../../../shared/config/dashboardVocabulary';
import { PROFILE_CLUSTER_PATHS } from '../../../shared/config/dashboardRoutes';
import { useDashboardMobileChromePortal } from '../../../shared/hooks/useDashboardMobileChromePortal';
import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';
import ProfileMobileFixedChrome from './ProfileMobileFixedChrome';

const SUB_NAV = [
  { to: PROFILE_CLUSTER_PATHS.profile, label: NAV_LABEL_PROFILE, end: true },
  { to: PROFILE_CLUSTER_PATHS.notifications, label: NAV_LABEL_MESSAGES, end: true },
  { to: PROFILE_CLUSTER_PATHS.account, label: NAV_LABEL_ACCOUNT, end: true },
];

/**
 * Persistent Profile-cluster sub-navigation (identity / messages / account).
 * Nested routes render via {@link Outlet}; `user` is passed through outlet context.
 * Mobile: sub-nav is fixed under the context bar (Standings chrome pattern).
 * Desktop: same {@link ChromeSegmentedControl} tray in-page (#765).
 *
 * @param {{ user: import('firebase/auth').User | null | undefined }} props
 */
export default function ProfileClusterLayout({ user }) {
  const mobileChromeRoot = useDashboardMobileChromePortal();

  return (
    <div className="max-w-xl mx-auto pb-6 md:pb-12">
      {mobileChromeRoot
        ? createPortal(<ProfileMobileFixedChrome />, mobileChromeRoot)
        : null}

      {/* Visibility stays at the cluster call site — not in shared chrome (#704). */}
      <div className="mb-6 hidden md:block">
        <ChromeSegmentedControl ariaLabel="Profile sections" items={SUB_NAV} />
      </div>
      <Outlet context={{ user }} />
    </div>
  );
}
