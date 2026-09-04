import React from 'react';

import {
  dashboardPageTitleGradientClasses,
  dashboardPageTitleWarRoomClasses,
} from '../config/dashboardHeadingTypography';

/**
 * Desktop page chrome block: cluster title + tertiary tray + optional trailing
 * action. Stickiness is owned by the layout sticky stack — this is
 * presentational only. Do not add md:-as-device assumptions here (#704).
 *
 * @param {{
 *   title: string,
 *   trailing?: React.ReactNode,
 *   tone?: 'default' | 'warRoom',
 *   children?: React.ReactNode,
 * }} props
 */
export default function DashboardStickyPageChrome({
  title,
  trailing = null,
  tone = 'default',
  children,
}) {
  const isWarRoom = tone === 'warRoom';

  return (
    <div className="border-b border-border-subtle/35 py-2.5">
      <h2
        className={`mb-3 mt-1 font-display text-display-page font-bold tracking-tight md:mb-4 md:text-display-page-lg ${
          isWarRoom ? dashboardPageTitleWarRoomClasses : dashboardPageTitleGradientClasses
        }`}
      >
        {title}
      </h2>
      {children || trailing ? (
        <div className="flex items-center justify-between gap-4">
          {children ? <div className="min-w-0 flex-1">{children}</div> : null}
          {trailing}
        </div>
      ) : null}
    </div>
  );
}
