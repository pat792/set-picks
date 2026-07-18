import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../shared/lib/ga4', () => ({
  ga4Event: vi.fn(),
}));

import { ga4Event } from '../../../shared/lib/ga4';
import { trackTourStatsView } from './tourStatsAnalytics.js';

describe('trackTourStatsView', () => {
  beforeEach(() => {
    ga4Event.mockClear();
  });

  it('emits tour_stats_view with tour scope', () => {
    trackTourStatsView({ tour: 'Summer Tour 2026' });
    expect(ga4Event).toHaveBeenCalledWith('tour_stats_view', {
      tour: 'Summer Tour 2026',
    });
  });

  it('defaults empty tour', () => {
    trackTourStatsView();
    expect(ga4Event).toHaveBeenCalledWith('tour_stats_view', { tour: '' });
  });
});
