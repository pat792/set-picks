import React from 'react';

import InfoTooltip, { InfoTooltipProvider } from '../../../shared/ui/InfoTooltip';
import { PICKS_ODDS_HINT, PICKS_ODDS_LABEL } from '../model/picksOddsCopy';

/**
 * “Odds” label + info tooltip for the top-right of a picks card.
 *
 * @param {{
 *   definition?: string,
 *   triggerClassName?: string,
 *   className?: string,
 * }} props
 */
export default function PicksOddsHint({
  definition = PICKS_ODDS_HINT,
  triggerClassName = 'text-content-secondary hover:text-white',
  className = '',
}) {
  return (
    <InfoTooltipProvider>
      <span className={`inline-flex items-center gap-1 ${className}`.trim()}>
        <span className="text-[10px] font-black uppercase tracking-widest text-content-secondary">
          {PICKS_ODDS_LABEL}
        </span>
        <InfoTooltip
          label={PICKS_ODDS_LABEL}
          definition={definition}
          triggerClassName={triggerClassName}
        />
      </span>
    </InfoTooltipProvider>
  );
}
