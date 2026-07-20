/**
 * Pre-lock disclosure gate (#689 / #694).
 * Deep crowd stats stay blurred while picks are still editable.
 *
 * @param {string} [showStatus]
 * @returns {boolean}
 */
export function shouldBlurDeepCrowdStats(showStatus) {
  return showStatus === 'NEXT';
}
