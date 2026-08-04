import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { shellTransitionKey } from './model/shellTransitionKey';
import AppBackground from '../../shared/ui/AppBackground';
import RouteSuspenseFallback from '../../shared/ui/RouteSuspenseFallback';

/**
 * Marketing-entry chrome (#832) — no FCM push bridge / SW update banner.
 * Those belong on the Firebase app entry only.
 */
export default function MarketingRootShell() {
  const { pathname } = useLocation();
  const transitionKey = shellTransitionKey(pathname);

  return (
    <>
      <AppBackground />
      <div className="relative z-[1] min-h-screen">
        <div key={transitionKey} className="min-h-screen animate-page-enter">
          <Suspense fallback={<RouteSuspenseFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </>
  );
}
