import React from 'react';
import { ArrowRight } from 'lucide-react';

import Button from '../../../shared/ui/Button';
import { MarketingMobileMenu } from './MarketingSiteNav';

/**
 * Sign In + Join pair shared by the splash header and marketing page header.
 * Mobile and desktop both keep the pair; the hamburger is `lg:hidden`.
 */
export default function MarketingHeaderAuthCluster({
  onSignIn,
  onJoin,
  onAuthCtaIntent,
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          variant="text"
          size="none"
          onClick={onSignIn}
          onPointerEnter={onAuthCtaIntent}
          onFocus={onAuthCtaIntent}
          onPointerDown={onAuthCtaIntent}
          className="h-10 w-full whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 hover:bg-white/10 hover:text-white sm:text-sm"
        >
          Sign In
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onJoin}
          onPointerEnter={onAuthCtaIntent}
          onFocus={onAuthCtaIntent}
          onPointerDown={onAuthCtaIntent}
          className="h-10 w-full gap-1.5 px-3 py-0"
        >
          Join
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Button>
      </div>

      <MarketingMobileMenu />
    </div>
  );
}
