import React from 'react';
import { UserPlus } from 'lucide-react';

import Button from '../../../shared/ui/Button';

/**
 * Prominent Invite promo for Standings (#609) — same visual weight as a
 * sponsor banner (logo tile + copy + CTA) so invite isn’t buried under chrome.
 * In-flow content block on mobile and desktop (not sticky chrome).
 *
 * @param {{ onInvite: () => void, className?: string }} props
 */
export default function StandingsInvitePromo({ onInvite, className = '' }) {
  return (
    <aside
      aria-label="Invite friends"
      className={['w-full', className].filter(Boolean).join(' ')}
    >
      <div className="flex min-h-[5rem] w-full items-center gap-3 rounded-xl border border-brand-primary/35 bg-brand-primary/10 px-3 py-3 md:min-h-[5.5rem]">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-brand-primary/40 bg-brand-primary/15">
          <UserPlus className="h-7 w-7 text-brand-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-snug text-white">
            Invite friends to play
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-content-secondary">
            Share a site or pool invite — more players, more competition, more fun!
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
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
