/**
 * Inline boot chrome for SEO-prerendered marketing HTML shells.
 *
 * Crawler copy stays in `#root` for non-JS consumers. Browsers paint a thin
 * top progress bar (not a full-screen spinner) so SEO/prerender body is
 * visible immediately while marketing JS downloads (#835).
 *
 * Pure HTML/CSS — no src/ imports (safe for build scripts).
 */

import { SPACE_GROTESK_FONT_FACE_CSS } from './space-grotesk-font-face.mjs';

/** Attribute marker asserted by `verify:seo-prerender`. */
export const MARKETING_BOOT_SHELL_MARKER = 'data-marketing-boot-shell';

/**
 * Critical CSS + non-blocking progress chrome injected into `#root`
 * ahead of the SEO body. Colors match `src/index.css` brand tokens.
 */
export function buildMarketingBootShellMarkup() {
  const css = `
${SPACE_GROTESK_FONT_FACE_CSS}
html, body {
  margin: 0;
  min-height: 100%;
  background: #1e1b4b;
  color: #e2e8f0;
}
[${MARKETING_BOOT_SHELL_MARKER}] {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  height: 3px;
  pointer-events: none;
  background: rgb(45 212 191 / 0.15);
  overflow: hidden;
}
[${MARKETING_BOOT_SHELL_MARKER}]::after {
  content: "";
  display: block;
  height: 100%;
  width: 40%;
  background: #2dd4bf;
  animation: mbs-slide 1.1s ease-in-out infinite;
}
@keyframes mbs-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(280%); }
}
@media (prefers-reduced-motion: reduce) {
  [${MARKETING_BOOT_SHELL_MARKER}]::after {
    animation: none;
    width: 100%;
    opacity: 0.55;
  }
}
main[data-seo-prerender="true"] {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 5.5rem 1.25rem 2rem;
  max-width: 42rem;
  margin: 0 auto;
  font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
}
main[data-seo-prerender="true"] h1 {
  margin: 0 0 1rem;
  font-size: clamp(1.75rem, 5vw, 2.5rem);
  line-height: 1.15;
  font-weight: 700;
  color: #f8fafc;
}
main[data-seo-prerender="true"] p {
  margin: 0 0 0.85rem;
  font-size: 1.05rem;
  line-height: 1.55;
  color: #cbd5e1;
  font-weight: 500;
}
`.trim();

  return [
    `<style id="marketing-boot-shell-css">${css}</style>`,
    `<div ${MARKETING_BOOT_SHELL_MARKER}="true" role="progressbar" aria-valuetext="Loading Setlist Pick'em" aria-label="Loading Setlist Pick'em"></div>`,
  ].join('');
}
