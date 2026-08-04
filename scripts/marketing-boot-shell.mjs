/**
 * Inline boot overlay for SEO-prerendered marketing HTML shells.
 *
 * Crawler copy stays in `#root` for non-JS consumers, but browsers paint this
 * branded overlay immediately (no entry JS required) so plain h1/p never flash
 * before the React Suspense spinner.
 *
 * Pure HTML/CSS — no src/ imports (safe for build scripts).
 */

/** Attribute marker asserted by `verify:seo-prerender`. */
export const MARKETING_BOOT_SHELL_MARKER = 'data-marketing-boot-shell';

/**
 * Critical CSS + overlay markup injected into `#root` ahead of the SEO body.
 * Colors match `src/index.css` brand tokens.
 */
export function buildMarketingBootShellMarkup() {
  const css = `
html, body {
  margin: 0;
  min-height: 100%;
  background: #1e1b4b;
}
[${MARKETING_BOOT_SHELL_MARKER}] {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: #1e1b4b;
  color: #2dd4bf;
  font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  font-weight: 700;
}
.mbs-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  border: 3px solid rgb(45 212 191 / 0.25);
  border-top-color: #2dd4bf;
  animation: mbs-spin 0.8s linear infinite;
}
.mbs-label {
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.01em;
}
@keyframes mbs-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .mbs-spinner { animation: none; border-top-color: rgb(45 212 191 / 0.45); }
}
`.trim();

  return [
    `<style id="marketing-boot-shell-css">${css}</style>`,
    `<div ${MARKETING_BOOT_SHELL_MARKER}="true" role="status" aria-busy="true" aria-label="Loading Setlist Pick'em">`,
    `<div class="mbs-spinner" aria-hidden="true"></div>`,
    `<p class="mbs-label">Loading…</p>`,
    `</div>`,
  ].join('');
}
