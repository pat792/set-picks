import { ga4Event } from '../../../shared/lib/ga4';

/**
 * Tour Stats explorer content is ready for the selected tour (#638).
 *
 * @param {{ tour?: string }} [payload]
 */
export function trackTourStatsView({ tour } = {}) {
  ga4Event('tour_stats_view', {
    tour: tour ?? '',
  });
}
