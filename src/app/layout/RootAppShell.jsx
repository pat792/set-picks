import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import AppBackground from '../../shared/ui/AppBackground';
import RouteSuspenseFallback from '../../shared/ui/RouteSuspenseFallback';

/**
 * Global chrome: ambient background + top-level route outlet with enter animation.
 * Keeps router hooks in the app layer; AppBackground stays a shared presentational primitive.
 *
 * The `<Suspense>` boundary here catches every top-level lazy route (dashboard,
 * setup, public profile, pool-invite, etc.), so we only need one boundary at
 * this level. Nested boundaries exist inside `DashboardLayout` for its child
 * pages.
 */
export default function RootAppShell() {
  const { pathname } = useLocation();

  return (
    <>
      <AppBackground />
      <div className="relative z-[1] min-h-screen">
        <div key={pathname} className="min-h-screen animate-page-enter">
          <Suspense fallback={<RouteSuspenseFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </>
  );
}
