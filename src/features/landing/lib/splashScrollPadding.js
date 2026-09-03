/**
 * Fixed `SplashHeader` height — applied as `scroll-padding-top` on `<html>` for splash
 * in-app navigation (`scrollIntoView`).
 *
 * Visual source of truth is `--header-height` in `marketingEditorialViewport.css`.
 * The hook toggles `SPLASH_SCROLL_PADDING_HTML_CLASS` so padding tracks that token.
 * Keep these rem fallbacks identical to the CSS values (5.35rem / 5.25rem).
 */
export const SPLASH_DOCUMENT_SCROLL_PADDING_MOBILE = '5.35rem';
export const SPLASH_DOCUMENT_SCROLL_PADDING_SM = '5.25rem';

/** Class on `<html>` while splash is mounted — `scroll-padding-top: var(--header-height)`. */
export const SPLASH_SCROLL_PADDING_HTML_CLASS = 'splash-scroll-padding';
