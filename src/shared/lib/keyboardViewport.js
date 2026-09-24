/** Overlap below this is URL-bar chrome, not an on-screen keyboard. */
export const KEYBOARD_OPEN_MIN_PX = 120;

/** Cap suggestion menu height (matches prior `max-h-64`). */
export const AUTOCOMPLETE_MENU_MAX_PX = 256;

/** Prefer flipping upward once space below the field is under this. */
export const AUTOCOMPLETE_MENU_MIN_PX = 160;

/**
 * CSS pixels of the layout viewport hidden below the visual viewport.
 * `position: fixed; bottom: 0` is anchored to the layout viewport, so this
 * is the inset that clears the keyboard, including iOS pan (`offsetTop`).
 *
 * @param {number} layoutHeight `documentElement.clientHeight`
 * @param {number} visualHeight `visualViewport.height`
 * @param {number} offsetTop `visualViewport.offsetTop`
 */
export function layoutViewportKeyboardOverlap(layoutHeight, visualHeight, offsetTop) {
  return Math.max(0, Math.round(layoutHeight - visualHeight - offsetTop));
}

/**
 * @param {{ overlap: number, scale?: number, minOverlapPx?: number }} state
 */
export function isVirtualKeyboardOpen({
  overlap,
  scale = 1,
  minOverlapPx = KEYBOARD_OPEN_MIN_PX,
}) {
  if (scale > 1.01) return false;
  return overlap >= minOverlapPx;
}

/**
 * Place a portaled listbox using the input's visual rect (`getBoundingClientRect`).
 * `position: fixed` on iOS Chrome tracks that same visual viewport, so do not
 * add `visualViewport.offsetTop` or the menu detaches and the form scrolls.
 *
 * @param {{
 *   anchorTop: number,
 *   anchorBottom: number,
 *   anchorLeft: number,
 *   anchorWidth: number,
 *   visualTop?: number,
 *   visualLeft?: number,
 *   visualHeight: number,
 *   minMenuPx?: number,
 *   maxMenuPx?: number,
 *   gapPx?: number,
 * }} metrics
 */
export function placeAutocompleteMenu({
  anchorTop,
  anchorBottom,
  anchorLeft,
  anchorWidth,
  visualTop = 0,
  visualLeft = 0,
  visualHeight,
  minMenuPx = AUTOCOMPLETE_MENU_MIN_PX,
  maxMenuPx = AUTOCOMPLETE_MENU_MAX_PX,
  gapPx = 8,
}) {
  const spaceBelow = visualHeight - anchorBottom - gapPx;
  const spaceAbove = anchorTop - visualTop - gapPx;
  const openUp = spaceBelow < minMenuPx && spaceAbove > spaceBelow;
  const available = Math.max(0, openUp ? spaceAbove : spaceBelow);
  const maxHeight = Math.max(48, Math.min(maxMenuPx, available || maxMenuPx));
  const top = openUp ? anchorTop - gapPx - maxHeight : anchorBottom + gapPx;
  return {
    top,
    left: anchorLeft + visualLeft,
    width: anchorWidth,
    maxHeight,
    openUp,
  };
}
