/**
 * Build-time gate for Prediction Lab UI + recommendations fetch (#651).
 * Matches SponsorSlot: only the string `'true'` enables; unset = off.
 *
 * @returns {boolean}
 */
export function isPredictionLabEnabled() {
  return import.meta.env.VITE_ENABLE_PREDICTION_LAB === 'true';
}
