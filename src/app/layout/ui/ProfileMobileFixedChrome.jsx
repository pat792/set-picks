import React from 'react';

import {
  NAV_LABEL_ACCOUNT,
  NAV_LABEL_MESSAGES,
  NAV_LABEL_PROFILE,
} from '../../../shared/config/dashboardVocabulary';
import { PROFILE_CLUSTER_PATHS } from '../../../shared/config/dashboardRoutes';
import DashboardMobileChromeBar from '../../../shared/ui/DashboardMobileChromeBar';
import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';

const SUB_NAV = [
  { to: PROFILE_CLUSTER_PATHS.profile, label: NAV_LABEL_PROFILE, end: true },
  { to: PROFILE_CLUSTER_PATHS.notifications, label: NAV_LABEL_MESSAGES, end: true },
  { to: PROFILE_CLUSTER_PATHS.account, label: NAV_LABEL_ACCOUNT, end: true },
];

/**
 * Mobile-only Profile cluster chrome (#609) — fixed under the context bar.
 * Same Profile / Messages / Account segmented control as the in-flow desktop nav.
 */
export default function ProfileMobileFixedChrome() {
  return (
    <DashboardMobileChromeBar
      heading="Profile sections"
      headingId="profile-mobile-chrome-heading"
    >
      <ChromeSegmentedControl ariaLabel="Profile sections" items={SUB_NAV} />
    </DashboardMobileChromeBar>
  );
}
