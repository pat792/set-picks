import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { dashboardPageTitleGradientClasses } from '../../../shared/config/dashboardHeadingTypography';
import {
  PROFILE_CLUSTER_PATHS,
  PROFILE_PREFERENCES_OPEN_PUSH_HREF,
} from '../../../shared/config/dashboardRoutes';
import CommsInboxSection from './CommsInboxSection.jsx';

/**
 * Account-cluster Messages — inbox only. Prefs live on Preferences (#770 / #513).
 */
export default function NotificationsPrototypeScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const openPush =
      searchParams.get('openPush') === '1' || searchParams.get('section') === 'push';
    if (!openPush) return;
    const next = new URLSearchParams(searchParams);
    const href = next.toString()
      ? `${PROFILE_CLUSTER_PATHS.account}?${next.toString()}`
      : PROFILE_PREFERENCES_OPEN_PUSH_HREF;
    navigate(href, { replace: true });
  }, [searchParams, navigate]);

  return (
    <div>
      <div className="mb-6 text-left">
        <h2
          className={`hidden md:block font-display text-display-page md:text-display-page-lg font-bold ${dashboardPageTitleGradientClasses}`}
        >
          Messages
        </h2>
        <p className="mt-2 text-sm font-bold leading-relaxed text-content-secondary md:mt-3">
          In-app updates land here — recaps, scores, and announcements. Notification settings
          live under Preferences.
        </p>
      </div>

      <CommsInboxSection />
    </div>
  );
}
