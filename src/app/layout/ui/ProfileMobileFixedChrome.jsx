import React from 'react';

import {
  NAV_LABEL_MESSAGES,
  NAV_LABEL_PREFERENCES,
  NAV_LABEL_PROFILE,
} from '../../../shared/config/dashboardVocabulary';
import { PROFILE_CLUSTER_PATHS } from '../../../shared/config/dashboardRoutes';
import DashboardMobileChromeBar from '../../../shared/ui/DashboardMobileChromeBar';
import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';

const SUB_NAV = [
  { to: PROFILE_CLUSTER_PATHS.profile, label: NAV_LABEL_PROFILE, end: true },
  { to: PROFILE_CLUSTER_PATHS.notifications, label: NAV_LABEL_MESSAGES, end: true },
  { to: PROFILE_CLUSTER_PATHS.account, label: NAV_LABEL_PREFERENCES, end: true },
];

/**
 * Mobile-only Account cluster chrome (#609 / #770) — fixed under the context bar.
 * Same Profile / Messages / Preferences segmented control as the in-flow desktop nav.
 */
export default function ProfileMobileFixedChrome() {
  return (
    <DashboardMobileChromeBar
      heading="Account sections"
      headingId="profile-mobile-chrome-heading"
    >
      <ChromeSegmentedControl ariaLabel="Account sections" items={SUB_NAV} />
    </DashboardMobileChromeBar>
  );
}
