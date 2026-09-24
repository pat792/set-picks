/**
 * Read-only snapshot for #1041. Does not change layout.
 * Rects are visual-viewport coordinates (`getBoundingClientRect`).
 *
 * @param {{
 *   clientHeight: number,
 *   visualHeight: number,
 *   offsetTop: number,
 *   navTop: number | null,
 *   navBottom: number | null,
 * }} metrics
 */
export function readKeyboardParitySnapshot({
  clientHeight,
  visualHeight,
  offsetTop,
  navTop,
  navBottom,
}) {
  const overlap = Math.round(clientHeight - visualHeight - offsetTop);
  const navInVisual =
    navTop != null &&
    navBottom != null &&
    navTop < visualHeight - 1 &&
    navBottom > 0;
  return { overlap, navInVisual };
}

/**
 * @param {{ navInVisual: boolean }} safari
 * @param {{ navInVisual: boolean }} chrome
 * @returns {'hide-nav-when-inside-visual' | 'measure-top-chrome' | 'unexpected'}
 */
export function keyboardParityDecision(safari, chrome) {
  if (!safari.navInVisual && chrome.navInVisual) return 'hide-nav-when-inside-visual';
  if (!chrome.navInVisual) return 'measure-top-chrome';
  return 'unexpected';
}
