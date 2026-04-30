import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

import {
  brandWordmarkChromeDashboardMobileBarClassNames,
  brandWordmarkDashboardMobileBarScaleWrapperClassNames,
} from '../../../shared/config/branding';
import { getBrandChromeWordmarkSvgMarkup } from '../../../shared/lib/brandGradientWordmarkSvg.js';

export default function DashboardMobileBrandBar({ user }) {
  const wordmarkMarkup = useMemo(() => getBrandChromeWordmarkSvgMarkup(), []);

  return (
    <div className="relative z-20 grid min-h-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-visible border-b border-border-subtle/35 bg-[linear-gradient(to_bottom,rgb(var(--brand-bg-deep)_/_0.76),rgb(var(--brand-bg)_/_0.60))] py-2 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-4 shadow-[0_10px_28px_-14px_rgba(15,10,46,0.85)] ring-1 ring-inset ring-white/[0.06] backdrop-blur-xl supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150 sm:flex sm:justify-between sm:gap-3 sm:pl-4 sm:pr-4">
      <h1 className="flex min-h-0 min-w-0 items-center justify-start justify-self-start self-center overflow-visible text-left leading-none max-sm:-translate-x-[1.125rem] max-sm:translate-y-1 sm:flex-1 sm:translate-x-0 sm:translate-y-0 sm:justify-self-auto">
        <Link
          to="/dashboard"
          className="inline-flex max-w-full items-center justify-start overflow-visible text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm hover:opacity-80 transition-opacity"
          aria-label="Setlist Pick 'Em — dashboard home"
        >
          <span className={brandWordmarkDashboardMobileBarScaleWrapperClassNames}>
            <span
              className={`${brandWordmarkChromeDashboardMobileBarClassNames} isolate`}
              dangerouslySetInnerHTML={{ __html: wordmarkMarkup }}
            />
          </span>
        </Link>
      </h1>

      <div className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border border-border-subtle/35 bg-surface-panel-strong text-xs">
        {user?.email?.charAt(0).toUpperCase() || '👤'}
      </div>
    </div>
  );
}