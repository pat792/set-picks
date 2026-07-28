/** localStorage cache for Storage `pick-recommendations.json` (#650). */
export const PICK_RECOMMENDATIONS_CACHE_KEY =
  'set-picks.pickRecommendationsCache.v1';

/** Align with ~6h scheduled refresh (+ :15 offset). */
export const PICK_RECOMMENDATIONS_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
