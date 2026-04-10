import { useLayoutEffect } from 'react';

import {
  SPLASH_DOCUMENT_SCROLL_PADDING_MOBILE,
  SPLASH_DOCUMENT_SCROLL_PADDING_SM,
} from '../lib/splashScrollPadding.js';

/**
 * Applies `scroll-padding-top` on `<html>` while the splash shell is mounted so
 * `scrollIntoView({ block: 'start' })` clears the fixed header without per-section
 * `scroll-margin-top`. Large scroll margins on multiple blocks can interact badly
 * with scroll anchoring during normal touch/wheel scrolling.
 */
export default function useSplashDocumentScrollPadding() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const mq = window.matchMedia('(min-width: 640px)');
    const apply = () => {
      html.style.scrollPaddingTop = mq.matches
        ? SPLASH_DOCUMENT_SCROLL_PADDING_SM
        : SPLASH_DOCUMENT_SCROLL_PADDING_MOBILE;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      html.style.scrollPaddingTop = '';
    };
  }, []);
}
