import React from 'react';

import {
  BRAND_APP_CHROME_MARK_SRC,
} from '../../../shared/config/branding';
import Button from '../../../shared/ui/Button';

/**
 * Local house-promo mock for the Standings `SponsorSlot` seam (#609).
 * Lets us QA filled layout (logo + copy + CTA) before ads Phase 1 (#121)
 * supplies Remote Config creatives. Not a real ad unit.
 *
 * @param {{ onCtaClick?: () => void }} props
 */
export default function StandingsSponsorPreview({ onCtaClick }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <img
        src={BRAND_APP_CHROME_MARK_SRC}
        alt=""
        width={56}
        height={56}
        className="h-14 w-14 shrink-0 rounded-xl object-contain"
        decoding="async"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold leading-snug text-white md:text-base">
          Bring your crew to Standings
        </p>
        <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-content-secondary md:text-xs">
          Invite friends to a pool — share the board, own the night.
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="shrink-0 !px-3 !py-1.5 text-[11px] sm:!px-3.5 sm:!py-2"
        onClick={onCtaClick}
      >
        Invite
      </Button>
    </div>
  );
}
