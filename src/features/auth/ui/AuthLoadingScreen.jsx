import React from 'react';

import {
  BRAND_APP_CHROME_MARK_SRC,
  brandAppChromeMarkImgClassNames,
} from '../../../shared/config/branding';

/** Branded auth gate (setup / non-dashboard). Dashboard uses `DashboardBootSkeleton`. */
export default function AuthLoadingScreen() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-transparent text-white"
      role="status"
      aria-busy="true"
      aria-label="Loading Setlist Pick'em"
    >
      <img
        src={BRAND_APP_CHROME_MARK_SRC}
        alt=""
        width={96}
        height={96}
        className={`${brandAppChromeMarkImgClassNames.dashboardMobileBar} h-24 w-auto opacity-90`}
        decoding="async"
      />
      <p className="text-sm font-bold text-content-secondary">Loading…</p>
    </div>
  );
}
