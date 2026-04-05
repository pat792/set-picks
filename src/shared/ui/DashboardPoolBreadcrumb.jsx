import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Option-C wayfinding: parent tab · current pool name (detail leaf is non-link).
 */
export default function DashboardPoolBreadcrumb({
  poolName,
  poolsPath = '/dashboard/pools',
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-1 flex min-w-0 items-center gap-2 text-sm font-semibold"
    >
      <Link
        to={poolsPath}
        className="shrink-0 text-emerald-400 transition-colors hover:text-emerald-300 hover:underline underline-offset-2 decoration-emerald-500/50"
      >
        Pools
      </Link>
      <span className="shrink-0 text-slate-600 select-none" aria-hidden>
        ·
      </span>
      <span
        className="min-w-0 truncate font-semibold text-slate-200"
        title={poolName}
      >
        {poolName}
      </span>
    </nav>
  );
}
