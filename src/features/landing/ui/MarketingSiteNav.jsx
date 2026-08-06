import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  MARKETING_LEGAL_NAV,
  MARKETING_PRIMARY_NAV,
} from '../model/marketingNav';
import {
  FOOTER_LINK_ON_DARK,
  HEADER_LINK_ACTIVE,
  HEADER_LINK_ON_DARK,
} from '../../../shared/ui/surfaceLinkStyles';

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
            className={`${HEADER_LINK_ON_DARK} ${active ? HEADER_LINK_ACTIVE : ''}`.trim()}
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
        <Link key={to} to={to} className={FOOTER_LINK_ON_DARK}>
          {label}
        </Link>
      ))}
    </p>
  );
}
