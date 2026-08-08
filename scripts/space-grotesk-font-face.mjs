/**
 * Early @font-face for Space Grotesk — must match the `<link rel="preload">`
 * URL in login.html / index.html / app.html and `src/index.css`.
 *
 * Preload alone does not apply the file; without this rule in critical CSS,
 * Safari warns that the font was preloaded but not used (boot shells name
 * the family before the Vite CSS bundle arrives).
 */
export const SPACE_GROTESK_FONT_FACE_CSS = `
@font-face {
  font-family: "Space Grotesk";
  src: url("/fonts/space-grotesk/SpaceGrotesk-VariableFont_wght.woff2") format("woff2");
  font-weight: 300 700;
  font-style: normal;
  font-display: swap;
}
`.trim();
