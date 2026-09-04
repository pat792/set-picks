import React from 'react';

import { DASHBOARD_DESKTOP_PAGE_CHROME_ROOT_ID } from '../../../shared/hooks/useDashboardMobileChromePortal';

/**
 * Desktop sticky stack in the dashboard scrollport: optional date/tour scope
 * plus a portal target for cluster title + tertiary tray. Banners and page
 * body render after this stack so they scroll underneath. Mobile is unchanged
 * (`hidden md:block`; #704 desk/mob screens stay follow-on).
 *
 * @param {{ children?: React.ReactNode }} props
 */
export default function DashboardStickyChromeStack({ children = null }) {
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-6 hidden bg-brand-bg/90 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-brand-bg/75 md:-mx-8 md:block md:px-8">
      {children ? <div className="pb-3 pt-1">{children}</div> : null}
      <div id={DASHBOARD_DESKTOP_PAGE_CHROME_ROOT_ID} />
    </div>
  );
}
