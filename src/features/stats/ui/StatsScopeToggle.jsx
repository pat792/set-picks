import React from 'react';

import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';
import InfoTooltip, {
  InfoTooltipProvider,
} from '../../../shared/ui/InfoTooltip';

/**
 * In-page All-time / This tour (or inner card) tray. Does not scroll the
 * dashboard chrome — that stays on tertiary nav only.
 *
 * @param {{
 *   ariaLabel: string,
 *   value: string,
 *   onChange: (id: string) => void,
 *   items: Array<{ id: string, label: string }>,
 *   hint?: string,
 *   hintLabel?: string,
 * }} props
 */
export default function StatsScopeToggle({
  ariaLabel,
  value,
  onChange,
  items,
  hint,
  hintLabel,
}) {
  return (
    <InfoTooltipProvider>
      <div className="flex items-center gap-2">
        <ChromeSegmentedControl
          ariaLabel={ariaLabel}
          value={value}
          onChange={onChange}
          items={items}
          scrollToTop={false}
          tone="inset"
          className="min-w-0 flex-1"
        />
        {hint ? (
          <InfoTooltip label={hintLabel || ariaLabel} definition={hint} />
        ) : null}
      </div>
    </InfoTooltipProvider>
  );
}
