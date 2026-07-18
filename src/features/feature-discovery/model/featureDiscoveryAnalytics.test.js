import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../shared/lib/ga4', () => ({
  ga4Event: vi.fn(),
}));

import { ga4Event } from '../../../shared/lib/ga4';
import {
  trackFeatureSpotlightClick,
  trackFeatureSpotlightDismissed,
  trackFeatureSpotlightImpression,
} from './featureDiscoveryAnalytics.js';

describe('featureDiscoveryAnalytics', () => {
  beforeEach(() => {
    ga4Event.mockClear();
  });

  it('emits impression / click / dismissed with feature_id', () => {
    trackFeatureSpotlightImpression({ feature_id: 'tour-stats' });
    trackFeatureSpotlightClick({ feature_id: 'tour-stats' });
    trackFeatureSpotlightDismissed({ feature_id: 'live-setlist' });

    expect(ga4Event).toHaveBeenNthCalledWith(1, 'feature_spotlight_impression', {
      feature_id: 'tour-stats',
    });
    expect(ga4Event).toHaveBeenNthCalledWith(2, 'feature_spotlight_click', {
      feature_id: 'tour-stats',
    });
    expect(ga4Event).toHaveBeenNthCalledWith(3, 'feature_spotlight_dismissed', {
      feature_id: 'live-setlist',
    });
  });
});
