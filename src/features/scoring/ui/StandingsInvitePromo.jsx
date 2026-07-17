import React from 'react';
import { UserPlus } from 'lucide-react';

import Button from '../../../shared/ui/Button';

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
      <div className="flex min-h-[5.75rem] w-full items-center gap-3.5 rounded-xl border border-border-subtle/60 bg-surface-panel/40 px-3.5 py-3.5 md:min-h-[6.25rem] md:gap-4 md:px-4 md:py-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-brand-primary/50 bg-transparent md:h-16 md:w-16">
          <UserPlus
            className="mt-1 h-7 w-7 text-brand-primary md:h-8 md:w-8"
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-snug text-brand-primary md:text-base">
            Invite your crew
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-content-secondary md:text-xs">
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
