import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../../auth';
import {
  trackFeatureSpotlightClick,
  trackFeatureSpotlightDismissed,
  trackFeatureSpotlightImpression,
} from './featureDiscoveryAnalytics';
import {
  getFeatureSpotlight,
  isSpotlightActive,
  writeSpotlightSeen,
} from './featureSpotlights';

/**
 * Soft “New” spotlight for one catalog feature (#639).
 *
 * @param {string} featureId
 * @param {{ trackImpression?: boolean }} [options]
 */
export function useFeatureSpotlight(featureId, options = {}) {
  const { trackImpression = true } = options;
  const { user } = useAuth();
  const uid = user?.uid || null;
  const [tick, setTick] = useState(0);
  const impressedRef = useRef(false);

  const spot = useMemo(() => getFeatureSpotlight(featureId), [featureId]);

  const active = useMemo(() => {
    void tick;
    return isSpotlightActive(featureId, { uid });
  }, [featureId, uid, tick]);

  useEffect(() => {
    if (!trackImpression || !active || !featureId) return;
    if (impressedRef.current) return;
    impressedRef.current = true;
    trackFeatureSpotlightImpression({ feature_id: featureId });
  }, [active, featureId, trackImpression]);

  const markSeen = useCallback(() => {
    if (!uid || !featureId) return;
    if (!isSpotlightActive(featureId, { uid })) return;
    writeSpotlightSeen(uid, featureId);
    trackFeatureSpotlightDismissed({ feature_id: featureId });
    setTick((t) => t + 1);
  }, [uid, featureId]);

  const trackClick = useCallback(() => {
    if (!featureId) return;
    trackFeatureSpotlightClick({ feature_id: featureId });
  }, [featureId]);

  return {
    featureId,
    path: spot?.path || '',
    active,
    markSeen,
    trackClick,
  };
}
