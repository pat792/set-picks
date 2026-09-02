import React, { useMemo } from 'react';
import { BarChart3, CalendarDays, ListOrdered, Users } from 'lucide-react';

import { NAV_LABEL_STATS } from '../../../shared/config/dashboardVocabulary';
import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';
import {
  FeatureNewBadge,
  useFeatureSpotlight,
} from '../../feature-discovery';

const OPTIONS = [
  { id: 'show', label: 'Show', icon: ListOrdered },
  { id: 'tour', label: 'Tour', icon: CalendarDays },
  { id: 'stats', label: NAV_LABEL_STATS, icon: BarChart3 },
  { id: 'pools', label: 'Pools', icon: Users },
];

/**
 * Primary IA toggle for Standings (#255 / #555) — Show / Tour / Stats / Pools.
 *
 * One {@link ChromeSegmentedControl} tray on mobile and desktop (#765).
 * Parents own placement: {@link StandingsMobileFixedChrome} (portal) vs
 * {@link StandingsStickyChrome} (sticky in-page). Stats remains a fourth
 * option until #769; do not trim to 3 here.
 *
 * State + navigation lives in {@link useStandingsView} /
 * {@link useStandingsViewChange}; this is the presentational half.
 *
 * @param {{
 *   view: 'show' | 'tour' | 'pools' | 'stats',
 *   onChange: (next: 'show' | 'tour' | 'pools' | 'stats') => void,
 *   className?: string,
 * }} props
 */
export default function StandingsViewToggle({ view, onChange, className = '' }) {
  const tourStatsSpotlight = useFeatureSpotlight('tour-stats');

  const handleChange = (next) => {
    if (next === 'stats' && tourStatsSpotlight.active) {
      tourStatsSpotlight.trackClick();
    }
    onChange(next);
  };

  const items = useMemo(() => {
    const badge = tourStatsSpotlight.active ? (
      <FeatureNewBadge variant="dot" title="New: Tour Stats" />
    ) : null;
    return OPTIONS.map((opt) =>
      opt.id === 'stats' ? { ...opt, badge } : opt,
    );
  }, [tourStatsSpotlight.active]);

  return (
    <ChromeSegmentedControl
      ariaLabel="Standings view"
      value={view}
      onChange={handleChange}
      items={items}
      className={className}
    />
  );
}
