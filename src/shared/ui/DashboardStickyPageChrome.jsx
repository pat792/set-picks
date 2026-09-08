import React from 'react';

import {
  dashboardPageTitleGradientClasses,
  dashboardPageTitleWarRoomClasses,
} from '../config/dashboardHeadingTypography';

/**
 * Desktop page chrome block: cluster title + optional trailing utility +
 * full-width tertiary tray. Trailing (Scoring rules, How pools work) sits on
 * the title row so it never steals tray width across clusters. Stickiness is
 * owned by the layout sticky stack — this is presentational only. Do not add
 * md:-as-device assumptions here (#704).
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
  const titleClass = `mt-1 font-display text-display-page font-bold tracking-tight md:text-display-page-lg ${
    isWarRoom ? dashboardPageTitleWarRoomClasses : dashboardPageTitleGradientClasses
  }`;

  return (
    <div className="border-b border-border-subtle/35 py-2.5">
      <div
        className={`flex items-center gap-3 ${
          children ? 'mb-3 md:mb-4' : ''
        }`}
      >
        <h2 className={`min-w-0 flex-1 ${titleClass}`}>{title}</h2>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
      {children ? <div className="w-full min-w-0">{children}</div> : null}
    </div>
  );
}
