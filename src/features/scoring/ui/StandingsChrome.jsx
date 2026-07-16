import React from 'react';
import { Scale, UserPlus } from 'lucide-react';

import GhostPill from '../../../shared/ui/GhostPill';
import StandingsViewToggle from './StandingsViewToggle';

/**
 * Standings chrome: Invite + Scoring rules utility row above Show/Tour/Pools.
 * Scoring rules uses the same GhostPill framing as Picks (kept on the right).
 * Invite uses the Tour Date gradient outline (white→teal) so it stands out without
 * matching solid teal view pills. Sticky stack stays on staging (#589/#590).
 *
 * @param {{
 *   view: 'show' | 'tour' | 'pools',
 *   onChange: (next: 'show' | 'tour' | 'pools') => void,
 *   onOpenScoringRules: () => void,
 *   onOpenInvite?: () => void,
 * }} props
 */
export default function StandingsChrome({
  view,
  onChange,
  onOpenScoringRules,
  onOpenInvite,
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        {onOpenInvite ? (
          <span
            className="inline-flex rounded-full bg-gradient-to-r from-white/35 via-brand-primary/85 to-brand-primary p-px shadow-[0_0_18px_rgb(var(--brand-primary)/0.22)] focus-within:ring-2 focus-within:ring-brand-primary/45 focus-within:ring-offset-0"
          >
            <GhostPill
              icon={UserPlus}
              onClick={onOpenInvite}
              className="!border-0 !bg-brand-bg-deep !font-semibold !text-brand-primary hover:!bg-surface-panel-strong hover:!text-brand-primary-strong"
            >
              Invite friends
            </GhostPill>
          </span>
        ) : (
          <span />
        )}
        <GhostPill icon={Scale} onClick={onOpenScoringRules}>
          Scoring rules
        </GhostPill>
      </div>

      <StandingsViewToggle view={view} onChange={onChange} className="mb-0" />
    </div>
  );
}
