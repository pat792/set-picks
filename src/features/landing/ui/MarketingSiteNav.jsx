import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  MARKETING_LEGAL_NAV,
  MARKETING_PRIMARY_NAV,
} from '../model/marketingNav';

const FOOTER_LINK =
  'text-slate-400 underline decoration-slate-600 underline-offset-2 transition-colors hover:text-slate-200 hover:decoration-slate-400';

const HEADER_LINK =
  'rounded-sm text-xs font-semibold text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue lg:text-sm';

const HEADER_LINK_ACTIVE = 'text-white';

/**
 * Compact primary nav for marketing page headers (#663).
 */
export function MarketingHeaderNav({ className = 'hidden lg:flex' }) {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Marketing"
      className={`items-center gap-3 xl:gap-4 ${className}`.trim()}
    >
      {MARKETING_PRIMARY_NAV.map(({ to, label }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            className={`${HEADER_LINK} ${active ? HEADER_LINK_ACTIVE : ''}`.trim()}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Footer link row: primary + legal (#663).
 */
export function MarketingFooterNav({ className = '' }) {
  const links = [...MARKETING_PRIMARY_NAV, ...MARKETING_LEGAL_NAV];
  return (
    <p className={`mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 ${className}`.trim()}>
      {links.map(({ to, label }) => (
        <Link key={to} to={to} className={FOOTER_LINK}>
          {label}
        </Link>
      ))}
    </p>
  );
}
