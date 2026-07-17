/**
 * Feature spotlight / “New” marker engagement (#638 contract, UI in #639).
 *
 * Wire these from `features/feature-discovery` when markers ship.
 */

import { ga4Event } from '../../../shared/lib/ga4';

/**
 * @param {{ feature_id?: string }} [payload]
 */
export function trackFeatureSpotlightImpression({ feature_id } = {}) {
  ga4Event('feature_spotlight_impression', {
    feature_id: feature_id ?? '',
  });
}

/**
 * @param {{ feature_id?: string }} [payload]
 */
export function trackFeatureSpotlightClick({ feature_id } = {}) {
  ga4Event('feature_spotlight_click', {
    feature_id: feature_id ?? '',
  });
}

/**
 * @param {{ feature_id?: string }} [payload]
 */
export function trackFeatureSpotlightDismissed({ feature_id } = {}) {
  ga4Event('feature_spotlight_dismissed', {
    feature_id: feature_id ?? '',
  });
}
