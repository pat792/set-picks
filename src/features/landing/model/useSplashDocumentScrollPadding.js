import { useLayoutEffect } from 'react';

import { SPLASH_SCROLL_PADDING_HTML_CLASS } from '../lib/splashScrollPadding.js';

/**
 * Applies `scroll-padding-top` on `<html>` while the splash shell is mounted so
 * `scrollIntoView({ block: 'start' })` clears the fixed header without per-section
 * `scroll-margin-top`. Large scroll margins on multiple blocks can interact badly
 * with scroll anchoring during normal touch/wheel scrolling.
 *
 * Padding value is `--header-height` (see `marketingEditorialViewport.css` / #968).
 */
export default function useSplashDocumentScrollPadding() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.classList.add(SPLASH_SCROLL_PADDING_HTML_CLASS);
    return () => {
      html.classList.remove(SPLASH_SCROLL_PADDING_HTML_CLASS);
    };
  }, []);
}
