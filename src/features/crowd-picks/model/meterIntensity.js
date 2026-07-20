/**
 * Relative bar fill for frequency meters (crowd pulse / similar strips).
 * Floors at 0.12 so tiny counts stay visible.
 *
 * @param {number} count
 * @param {number} max
 * @returns {number} 0–1
 */
export function meterIntensity(count, max) {
  const c = typeof count === 'number' ? count : 0;
  const m = typeof max === 'number' ? max : 0;
  if (m <= 0) return 0.12;
  return Math.max(0.12, c / m);
}
