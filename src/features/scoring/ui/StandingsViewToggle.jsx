import React from 'react';
import { CalendarDays, ListOrdered, Users } from 'lucide-react';

import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';

const OPTIONS = [
  { id: 'show', label: 'Show', icon: ListOrdered },
  { id: 'tour', label: 'Tour', icon: CalendarDays },
  { id: 'pools', label: 'Pools', icon: Users },
];

/**
 * Primary IA toggle for Standings (#255 / #769) — Show / Tour / Pools.
 *
 * One {@link ChromeSegmentedControl} tray on mobile and desktop (#765).
 * Parents own placement: {@link StandingsMobileFixedChrome} (mobile portal) vs
 * {@link StandingsStickyChrome} (desktop sticky-stack portal). Stats moved to the Stats
 * primary (#769) — do not add a fourth segment here.
 *
 * State + navigation lives in {@link useStandingsView} /
 * {@link useStandingsViewChange}; this is the presentational half.
 *
 * @param {{
 *   view: 'show' | 'tour' | 'pools',
 *   onChange: (next: 'show' | 'tour' | 'pools') => void,
 *   className?: string,
 * }} props
 */
export default function StandingsViewToggle({ view, onChange, className = '' }) {
  return (
    <ChromeSegmentedControl
      ariaLabel="Standings view"
      value={view}
      onChange={onChange}
      items={OPTIONS}
      className={className}
    />
  );
}
