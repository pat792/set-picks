import React from 'react';
import { UserPlus } from 'lucide-react';

import Button from '../../../shared/ui/Button';
import {
  STANDINGS_BOX_BODY,
  STANDINGS_BOX_L1_MIN_H,
  STANDINGS_BOX_MEDIA_TILE,
  STANDINGS_BOX_PAD,
  STANDINGS_BOX_RADIUS,
  STANDINGS_BOX_TITLE,
} from './standingsSurfaceClasses';

/**
 * Prominent Invite promo for Standings (#609) — same visual weight as a
 * sponsor banner (logo tile + copy + CTA) so invite isn’t buried under chrome.
 * In-flow content block on mobile and desktop (not sticky chrome).
 * Outer shell matches {@link SponsorSlot} fill/border; interior keeps teal
 * outline treatment (title, icon tile, secondary CTA).
 *
 * @param {{ onInvite: () => void, className?: string }} props
 */
export default function StandingsInvitePromo({ onInvite, className = '' }) {
  return (
    <aside
      aria-label="Invite friends"
      className={['w-full', className].filter(Boolean).join(' ')}
    >
      <div
        className={`flex ${STANDINGS_BOX_L1_MIN_H} w-full items-center gap-3.5 ${STANDINGS_BOX_RADIUS} border border-border-subtle/60 bg-surface-panel/40 ${STANDINGS_BOX_PAD} md:gap-4`}
      >
        <div
          className={`flex ${STANDINGS_BOX_MEDIA_TILE} items-center justify-center border-2 border-brand-primary/50 bg-transparent md:h-16 md:w-16`}
        >
          <UserPlus
            className="mt-1 h-7 w-7 text-brand-primary md:h-8 md:w-8"
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate ${STANDINGS_BOX_TITLE}`}>
            <span className="text-brand-primary">Invite your crew</span>
          </p>
          <p className={`mt-0.5 line-clamp-2 ${STANDINGS_BOX_BODY}`}>
            Click Invite to send a personalized invite via text or social
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 !px-3 !py-1.5 text-[11px] sm:!px-3.5 sm:!py-2"
          onClick={onInvite}
        >
          Invite
        </Button>
      </div>
    </aside>
  );
}
