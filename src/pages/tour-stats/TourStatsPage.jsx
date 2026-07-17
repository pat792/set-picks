import React from 'react';

import { TourStatsView, useTourStatsScreen } from '../../features/tour-stats';

/**
 * Dashboard Tour stats explorer (#555) — private, on-demand setlist aggregation.
 *
 * @param {{ selectedDate?: string | null }} props
 */
export default function TourStatsPage({ selectedDate = null }) {
  const screen = useTourStatsScreen({ selectedDate });
  return <TourStatsView {...screen} />;
}
