import React from 'react';

import {
  brandWordmarkBarRowDashboardExtrasClassNames,
  brandWordmarkBarRowGridBaseClassNames,
  brandWordmarkBarRowSplashExtrasClassNames,
} from '../config/branding';

/**
 * Two-column brand row shared by splash header and dashboard mobile chrome (#174).
 *
 * @param {{ variant?: 'splash' | 'dashboard', children: React.ReactNode, className?: string }} props
 */
export default function BrandWordmarkBarRow({
  variant = 'splash',
  children,
  className = '',
}) {
  const extras =
    variant === 'dashboard'
      ? brandWordmarkBarRowDashboardExtrasClassNames
      : brandWordmarkBarRowSplashExtrasClassNames;
  return (
    <div
      className={`${brandWordmarkBarRowGridBaseClassNames} ${extras} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
