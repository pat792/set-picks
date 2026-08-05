/**
 * Branded `/login` boot shell (#835 follow-up).
 *
 * Must NOT reuse the dashboard skeleton (bottom tabs / sidebar) — marketing CTAs
 * hard-nav here, and a 5–10s dashboard chrome flash on mobile Safari reads as a
 * broken redirect. Paint a marketing-like header + centered auth-card skeleton
 * until LoginPage replaces `#root`.
 *
 * Pure HTML/CSS — no src/ imports (safe for build scripts).
 */

import { stripPrerenderBodyFromSpaShell } from './seo-strip-body.mjs';

/** Attribute marker asserted by `verify:seo-prerender`. */
export const LOGIN_BOOT_SHELL_MARKER = 'data-login-boot-shell';

const VINYL_MARK_SRC = '/branding/splash-vinyl-mark.webp';

function loginBootShellCriticalCss() {
  return `
html, body {
  margin: 0;
  min-height: 100%;
  background: #1e1b4b;
}
.lbs-shell {
  position: relative;
  display: flex;
  min-height: 100dvh;
  width: 100%;
  flex-direction: column;
  color: #fff;
  background: #1e1b4b;
  font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
}
.lbs-ambient {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}
.lbs-ambient::before,
.lbs-ambient::after {
  content: "";
  position: absolute;
  border-radius: 9999px;
  filter: blur(100px);
}
.lbs-ambient::before {
  top: -20%;
  left: 50%;
  width: min(100vw, 36rem);
  height: min(100vw, 36rem);
  transform: translateX(-50%);
  background: rgb(45 212 191 / 0.12);
}
.lbs-ambient::after {
  bottom: -10%;
  right: -15%;
  width: min(85vw, 28rem);
  height: min(70vh, 32rem);
  background: rgb(59 130 246 / 0.12);
}
.lbs-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  height: 3px;
  pointer-events: none;
  background: rgb(45 212 191 / 0.15);
  overflow: hidden;
}
.lbs-progress::after {
  content: "";
  display: block;
  height: 100%;
  width: 40%;
  background: #2dd4bf;
  animation: lbs-slide 1.1s ease-in-out infinite;
}
@keyframes lbs-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(280%); }
}
.lbs-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  height: 5.35rem;
  padding: 0 1rem;
  border-bottom: 1px solid rgb(255 255 255 / 0.05);
  background: rgb(30 27 75 / 0.8);
  backdrop-filter: blur(12px);
}
.lbs-header-mark {
  display: block;
  width: 3.25rem;
  height: 3.25rem;
  object-fit: contain;
}
.lbs-main {
  position: relative;
  z-index: 10;
  display: flex;
  flex: 1;
  width: 100%;
  justify-content: center;
  padding: 2.5rem 1rem 2rem;
}
.lbs-panel {
  width: 100%;
  max-width: 28rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(51 65 85 / 0.6);
  background: rgb(32 40 62 / 0.4);
  padding: 1.5rem;
}
.lbs-title {
  height: 1.75rem;
  width: 42%;
  margin-bottom: 1.25rem;
  border-radius: 0.5rem;
  background: rgb(148 163 184 / 0.22);
}
.lbs-google {
  height: 3rem;
  width: 100%;
  margin-bottom: 1.25rem;
  border-radius: 0.75rem;
  background: rgb(248 250 252 / 0.92);
}
.lbs-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.lbs-divider-line {
  flex: 1;
  height: 1px;
  background: rgb(51 65 85 / 0.6);
}
.lbs-field {
  height: 2.75rem;
  width: 100%;
  margin-bottom: 0.85rem;
  border-radius: 0.5rem;
  background: rgb(26 32 52 / 0.9);
  animation: lbs-pulse 1.4s ease-in-out infinite;
}
.lbs-submit {
  height: 3rem;
  width: 100%;
  margin-top: 0.5rem;
  border-radius: 0.75rem;
  background: rgb(45 212 191 / 0.28);
  box-shadow: inset 0 0 0 1px rgb(45 212 191 / 0.25);
}
@keyframes lbs-pulse {
  0%, 100% { opacity: 0.72; }
  50% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .lbs-progress::after {
    animation: none;
    width: 100%;
    opacity: 0.55;
  }
  .lbs-field { animation: none; }
}
`.trim();
}

/** Static skeleton markup placed inside `#root`. */
export function buildLoginBootShellMarkup() {
  return [
    `<style id="login-boot-shell-css">${loginBootShellCriticalCss()}</style>`,
    `<div ${LOGIN_BOOT_SHELL_MARKER}="true" class="lbs-shell" role="status" aria-busy="true" aria-label="Loading sign-in">`,
    `<div class="lbs-ambient" aria-hidden="true"></div>`,
    `<div class="lbs-progress" aria-hidden="true"></div>`,
    `<header class="lbs-header" aria-hidden="true">`,
    `<img class="lbs-header-mark" src="${VINYL_MARK_SRC}" alt="" width="64" height="64" decoding="async" fetchpriority="high" />`,
    `</header>`,
    `<main class="lbs-main">`,
    `<div class="lbs-panel" aria-hidden="true">`,
    `<div class="lbs-title"></div>`,
    `<div class="lbs-google"></div>`,
    `<div class="lbs-divider"><div class="lbs-divider-line"></div><div class="lbs-divider-line"></div></div>`,
    `<div class="lbs-field"></div>`,
    `<div class="lbs-field"></div>`,
    `<div class="lbs-submit"></div>`,
    `</div>`,
    `</main>`,
    `</div>`,
  ].join('');
}

/**
 * Build the `/login` boot shell from the Vite app SPA shell.
 * @param {string} spaHtml
 * @returns {string}
 */
export function buildLoginBootShellHtml(spaHtml) {
  const emptied = stripPrerenderBodyFromSpaShell(spaHtml);
  if (typeof emptied !== 'string' || !emptied) return emptied;
  const markup = buildLoginBootShellMarkup();
  return emptied.replace(
    /<div id="root">\s*<\/div>/i,
    `<div id="root">${markup}</div>`,
  );
}
