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

/** Visual-height drop vs rest that means a keyboard, not the URL bar. */
export const KEYBOARD_VISUAL_DROP_PX = 150;

/**
 * Keyboard-open signal. Not the failed overlap formula
 * (`clientHeight - vv.height - offsetTop`), which is 0 on iOS Chrome.
 *
 * @param {{
 *   visualHeight: number,
 *   restingVisualHeight: number,
 *   scale?: number,
 * }} metrics
 */
export function isVisualKeyboardOpen({
  visualHeight,
  restingVisualHeight,
  scale = 1,
}) {
  if (Math.abs(scale - 1) > 0.05) return false;
  return restingVisualHeight - visualHeight >= KEYBOARD_VISUAL_DROP_PX;
}

/**
 * Hide gate after the keyboard has settled. Overlap is ignored.
 * Chrome (overlap 0, nav still on screen) hides; Safari (nav already
 * panned out of the visual viewport) does not.
 *
 * @param {{
 *   navInVisual: boolean,
 *   visualHeight: number,
 *   restingVisualHeight: number,
 *   scale?: number,
 * }} metrics
 */
export function shouldHidePrimaryNavAfterKeyboardSettle({
  navInVisual,
  visualHeight,
  restingVisualHeight,
  scale = 1,
}) {
  return (
    isVisualKeyboardOpen({ visualHeight, restingVisualHeight, scale }) &&
    navInVisual === true
  );
}
