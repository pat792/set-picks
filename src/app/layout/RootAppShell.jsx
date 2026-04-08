import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import AppBackground from '../../shared/ui/AppBackground';

/**
 * Global chrome: ambient background + top-level route outlet with enter animation.
 * Keeps router hooks in the app layer; AppBackground stays a shared presentational primitive.
 */
export default function RootAppShell() {
  const { pathname } = useLocation();

  return (
    <>
      <AppBackground />
      <div className="relative z-[1] min-h-screen">
        <div key={pathname} className="min-h-screen animate-page-enter">
          <Outlet />
        </div>
      </div>
    </>
  );
}
