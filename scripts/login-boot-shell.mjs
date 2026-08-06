/**
 * HTML-first `/login` auth-door shell (#892 / epic #889 Phase 2).
 *
 * First document must include real form controls (not skeleton-only). Auth JS
 * hydrates on top. Must NOT reuse dashboard chrome (tabs / sidebar).
 *
 * Pure HTML/CSS — no src/ imports (safe for build scripts).
 */

import { stripPrerenderBodyFromSpaShell } from './seo-strip-body.mjs';

/** Attribute marker asserted by `verify:seo-prerender`. */
export const LOGIN_BOOT_SHELL_MARKER = 'data-login-boot-shell';

/** Marks real form chrome in first HTML (#892 acceptance). */
export const LOGIN_FORM_SHELL_MARKER = 'data-login-form-shell';

const VINYL_MARK_SRC = '/branding/splash-vinyl-mark.webp';
const GOOGLE_ICON_SRC =
  'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';

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
.lbs-header-link {
  display: block;
  line-height: 0;
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
.lbs-stack {
  width: 100%;
  max-width: 28rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.lbs-eyebrow {
  margin: 0 0 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(148 163 184);
}
.lbs-panel {
  width: 100%;
  max-width: 28rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(51 65 85 / 0.6);
  background: rgb(32 40 62 / 0.4);
  padding: 1.5rem;
  box-sizing: border-box;
}
.lbs-title {
  margin: 0 0 1.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #fff;
}
.lbs-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  width: 100%;
  min-height: 3rem;
  margin: 0 0 1.25rem;
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 0.75rem;
  background: rgb(248 250 252 / 0.96);
  color: rgb(15 23 42);
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: not-allowed;
  opacity: 0.85;
  box-sizing: border-box;
}
.lbs-google-icon {
  width: 1.15rem;
  height: 1.15rem;
}
.lbs-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  color: rgb(148 163 184);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.lbs-divider-line {
  flex: 1;
  height: 1px;
  background: rgb(51 65 85 / 0.6);
}
.lbs-label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(148 163 184);
}
.lbs-field {
  display: block;
  width: 100%;
  margin: 0 0 0.85rem;
  padding: 0.75rem 1rem;
  border: 2px solid rgb(51 65 85 / 0.85);
  border-radius: 0.75rem;
  background: rgb(26 32 52 / 0.95);
  color: #fff;
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  box-sizing: border-box;
}
.lbs-field:focus {
  outline: 2px solid rgb(45 212 191 / 0.65);
  outline-offset: 1px;
  border-color: rgb(45 212 191 / 0.55);
}
.lbs-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 3rem;
  margin-top: 0.35rem;
  padding: 0.75rem 1rem;
  border: 1px solid rgb(45 212 191 / 0.45);
  border-radius: 0.75rem;
  background: rgb(45 212 191 / 0.18);
  color: rgb(204 251 241);
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-sizing: border-box;
}
.lbs-switch {
  margin: 1.5rem 0 0;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(148 163 184);
}
.lbs-switch a {
  color: rgb(94 234 212);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: rgb(20 184 166 / 0.6);
}
.lbs-panel[hidden] {
  display: none !important;
}
.lbs-legal {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin: 0 0 1rem;
  padding: 0.85rem;
  border: 1px solid rgb(51 65 85 / 0.6);
  border-radius: 0.75rem;
  background: rgb(15 23 42 / 0.35);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
  color: rgb(226 232 240);
}
.lbs-legal input {
  margin-top: 0.2rem;
}
.lbs-legal a {
  color: rgb(94 234 212);
}
@media (prefers-reduced-motion: reduce) {
  .lbs-progress::after {
    animation: none;
    width: 100%;
    opacity: 0.55;
  }
}
`.trim();
}

/**
 * Tiny inline boot: flip signin/signup panels from `?mode=` / `signup=1`
 * before hydrate JS arrives.
 */
function loginModeBootScript() {
  return `<script>
(function () {
  try {
    var q = new URLSearchParams(window.location.search);
    var mode = (q.get('mode') || '').toLowerCase();
    var signup = mode === 'signup' || q.get('signup') === '1';
    var signin = document.getElementById('lbs-signin');
    var signupEl = document.getElementById('lbs-signup');
    var eyebrow = document.getElementById('lbs-eyebrow');
    if (!signin || !signupEl) return;
    if (signup) {
      signin.hidden = true;
      signupEl.hidden = false;
      if (eyebrow) eyebrow.textContent = 'Create your free account';
    } else {
      signin.hidden = false;
      signupEl.hidden = true;
      if (eyebrow) eyebrow.textContent = 'Sign in to make picks';
    }

    // #909: neutral focus — reject Safari autofocus until a real gesture.
    // Listeners are on document so they survive React replacing #root.
    if (document.documentElement.dataset.loginFocusGuard !== '1') {
      document.documentElement.dataset.loginFocusGuard = '1';
      var gestured = false;
      function markGesture() { gestured = true; }
      document.addEventListener('pointerdown', markGesture, true);
      document.addEventListener('touchstart', markGesture, true);
      document.addEventListener('keydown', markGesture, true);
      function isCred(el) {
        if (!el || el.tagName !== 'INPUT') return false;
        var t = (el.getAttribute('type') || '').toLowerCase();
        if (t === 'checkbox' || t === 'radio' || t === 'hidden' || t === 'submit') return false;
        return t === 'email' || t === 'password' || t === 'text' || t === '' ||
          el.id === 'si-email' || el.id === 'si-pass' ||
          el.id === 'su-email' || el.id === 'su-pass' || el.id === 'su-confirm';
      }
      function parkFocus() {
        var park = document.getElementById('login-focus-park');
        if (park && park.focus) park.focus({ preventScroll: true });
      }
      function neutralize() {
        var ae = document.activeElement;
        if (!isCred(ae)) return;
        ae.blur();
        parkFocus();
      }
      document.addEventListener('focusin', function (ev) {
        var t = ev.target;
        if (!isCred(t)) return;
        if (gestured) {
          if (t.readOnly) t.readOnly = false;
          return;
        }
        t.blur();
        parkFocus();
      }, true);
      neutralize();
      if (window.requestAnimationFrame) requestAnimationFrame(neutralize);
      setTimeout(neutralize, 0);
      setTimeout(neutralize, 50);
      setTimeout(neutralize, 150);
      setTimeout(neutralize, 400);
    }
  } catch (e) {}
})();
</script>`;
}

/** Static HTML-first form chrome placed inside `#root`. */
export function buildLoginBootShellMarkup() {
  return [
    `<style id="login-boot-shell-css">${loginBootShellCriticalCss()}</style>`,
    `<div ${LOGIN_BOOT_SHELL_MARKER}="true" ${LOGIN_FORM_SHELL_MARKER}="true" class="lbs-shell">`,
    // Non-editable focus park so Safari autofocus has somewhere non-credential to land (#909).
    `<button type="button" id="login-focus-park" tabindex="-1" aria-hidden="true" style="position:fixed;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;opacity:0;pointer-events:none"></button>`,
    `<div class="lbs-ambient" aria-hidden="true"></div>`,
    `<div class="lbs-progress" aria-hidden="true"></div>`,
    `<header class="lbs-header">`,
    `<a class="lbs-header-link" href="/" aria-label="Setlist Pick'em home">`,
    `<img class="lbs-header-mark" src="${VINYL_MARK_SRC}" alt="" width="64" height="64" decoding="async" fetchpriority="high" />`,
    `</a>`,
    `</header>`,
    `<main class="lbs-main">`,
    `<div class="lbs-stack">`,
    `<p id="lbs-eyebrow" class="lbs-eyebrow">Sign in to make picks</p>`,

    // Sign-in panel (default)
    `<section id="lbs-signin" class="lbs-panel" aria-label="Sign in">`,
    `<h1 class="lbs-title">Sign in</h1>`,
    `<button type="button" class="lbs-google" disabled aria-disabled="true">`,
    `<img class="lbs-google-icon" src="${GOOGLE_ICON_SRC}" alt="" width="18" height="18" />`,
    `<span>Preparing sign-in…</span>`,
    `</button>`,
    `<div class="lbs-divider"><div class="lbs-divider-line"></div><span>or</span><div class="lbs-divider-line"></div></div>`,
    `<form action="/login" method="get" autocomplete="on">`,
    `<label class="lbs-label" for="si-email">Email</label>`,
    // readonly until intentional focus — suppresses Safari Keychain sheet (#909)
    `<input class="lbs-field" id="si-email" name="email" type="email" autocomplete="username" required readonly />`,
    `<label class="lbs-label" for="si-pass">Password</label>`,
    `<input class="lbs-field" id="si-pass" name="password" type="password" autocomplete="current-password" required readonly />`,
    `<button class="lbs-submit" type="submit">Continue with email</button>`,
    `</form>`,
    `<p class="lbs-switch">New here? <a href="/login?mode=signup">Create account</a></p>`,
    `</section>`,

    // Sign-up panel (shown via query / hydrate)
    `<section id="lbs-signup" class="lbs-panel" aria-label="Create account" hidden>`,
    `<h1 class="lbs-title">Create account</h1>`,
    `<label class="lbs-legal">`,
    `<input type="checkbox" name="legal" value="1" disabled />`,
    `<span>I agree to the <a href="/terms" onclick="try{sessionStorage.setItem('splashResumeAuthModal','signup')}catch(e){}">Terms of Service</a> and <a href="/privacy" onclick="try{sessionStorage.setItem('splashResumeAuthModal','signup')}catch(e){}">Privacy Policy</a>.</span>`,
    `</label>`,
    `<button type="button" class="lbs-google" disabled aria-disabled="true">`,
    `<img class="lbs-google-icon" src="${GOOGLE_ICON_SRC}" alt="" width="18" height="18" />`,
    `<span>Preparing sign-in…</span>`,
    `</button>`,
    `<div class="lbs-divider"><div class="lbs-divider-line"></div><span>or</span><div class="lbs-divider-line"></div></div>`,
    `<form action="/login" method="get" autocomplete="on">`,
    `<label class="lbs-label" for="su-email">Email</label>`,
    `<input class="lbs-field" id="su-email" name="email" type="email" autocomplete="email" required readonly />`,
    `<label class="lbs-label" for="su-pass">Password</label>`,
    `<input class="lbs-field" id="su-pass" name="password" type="password" autocomplete="new-password" required minlength="6" readonly />`,
    `<label class="lbs-label" for="su-confirm">Confirm password</label>`,
    `<input class="lbs-field" id="su-confirm" name="confirm-password" type="password" autocomplete="new-password" required readonly />`,
    `<button class="lbs-submit" type="submit">Accept terms to continue</button>`,
    `</form>`,
    `<p class="lbs-switch">Already have an account? <a href="/login?mode=signin">Sign in</a></p>`,
    `</section>`,

    `</div>`,
    `</main>`,
    `</div>`,
    loginModeBootScript(),
  ].join('');
}

/**
 * Build the `/login` boot shell from the Vite login entry (`login.html`).
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
