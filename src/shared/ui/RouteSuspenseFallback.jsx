import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Shared fallback for `<Suspense>` boundaries that wrap lazy-loaded route
 * chunks. Matches the brand loading treatment used by the Standings page /
 * Pool Hub so transitions between eager and lazy routes feel identical.
 *
 * Rendered both at the top-level shell (`RootAppShell` → `<Outlet />`) and
 * inside the dashboard sub-routes (`DashboardLayout` → `<Routes>`). Keep the
 * copy neutral so it works for any route.
 */
export default function RouteSuspenseFallback({ label = 'Loading…' }) {
  return (
    <div
      className="mt-20 flex flex-col items-center justify-center gap-3 font-bold text-brand-primary"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
      <p>{label}</p>
    </div>
  );
}
