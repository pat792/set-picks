/**
 * HTML-first marketing documents (#829 Bucket A).
 *
 * Builds a full branded public page (content + CTAs) and strips the Vite SPA
 * entry + modulepreloads so cold opens from search/Gen-AI never download
 * Firebase / AuthProvider / the app graph.
 *
 * Pure Node — no src/ imports beyond what callers already use.
 */

/** Keep in sync with `src/shared/lib/persistedSessionHint.js`. */
const PERSISTED_SESSION_HINT_STORAGE_KEY = 'setpicks_session_hint_v1';

/** Marker asserted by verify:seo-prerender. */
export const MARKETING_STATIC_PAGE_MARKER = 'data-marketing-static-page';

const BRAND_BG = '#1e1b4b';
const BRAND_PRIMARY = '#2dd4bf';
const BRAND_TEXT = '#ffffff';
const BRAND_MUTED = '#cbd5e1';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function criticalCss() {
  return `
html, body {
  margin: 0;
  min-height: 100%;
  background: ${BRAND_BG};
  color: ${BRAND_TEXT};
  font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
}
[${MARKETING_STATIC_PAGE_MARKER}] {
  position: relative;
  min-height: 100dvh;
  box-sizing: border-box;
  padding: 1.25rem 1.25rem 3rem;
  max-width: 42rem;
  margin: 0 auto;
}
.msp-ambient {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}
.msp-ambient::before,
.msp-ambient::after {
  content: "";
  position: absolute;
  border-radius: 9999px;
  filter: blur(100px);
}
.msp-ambient::before {
  top: -20%;
  left: 50%;
  width: min(100vw, 36rem);
  height: min(100vw, 36rem);
  transform: translateX(-50%);
  background: rgb(45 212 191 / 0.12);
}
.msp-ambient::after {
  bottom: -10%;
  right: -15%;
  width: min(85vw, 28rem);
  height: min(70vh, 32rem);
  background: rgb(59 130 246 / 0.12);
}
.msp-inner { position: relative; z-index: 1; }
.msp-brand {
  display: block;
  font-size: clamp(1.75rem, 5vw, 2.35rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${BRAND_TEXT};
  text-decoration: none;
  margin: 0 0 1.5rem;
}
.msp-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.1rem;
  margin: 0 0 2rem;
  padding: 0;
  list-style: none;
  font-size: 0.95rem;
  font-weight: 600;
}
.msp-nav a {
  color: ${BRAND_MUTED};
  text-decoration: none;
}
.msp-nav a:hover { color: ${BRAND_PRIMARY}; }
.msp-h1 {
  margin: 0 0 1rem;
  font-size: clamp(1.55rem, 4.5vw, 2.1rem);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.msp-lead, .msp-p {
  margin: 0 0 1rem;
  font-size: 1.05rem;
  line-height: 1.55;
  color: ${BRAND_MUTED};
  font-weight: 500;
}
.msp-cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1.75rem 0 2.25rem;
}
.msp-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.65rem 1.15rem;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  border: 1px solid transparent;
}
.msp-cta--primary {
  background: ${BRAND_PRIMARY};
  color: ${BRAND_BG};
}
.msp-cta--secondary {
  background: transparent;
  color: ${BRAND_TEXT};
  border-color: rgb(148 163 184 / 0.45);
}
.msp-footer {
  margin-top: 2.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgb(51 65 85 / 0.55);
  font-size: 0.85rem;
  color: ${BRAND_MUTED};
}
.msp-footer a { color: ${BRAND_PRIMARY}; }
`.trim();
}

/** Nav links shared across static marketing pages. */
const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/how-scoring-works', label: 'Scoring' },
  { href: '/tour-stats', label: 'Tour stats' },
  { href: '/phish-setlist-prediction-game', label: 'The game' },
];

/**
 * Inline boot script for `/` only: returning-session → dashboard; legacy
 * `?login=true` → `/login` app entry (Bucket A bridge until Bucket B retargets).
 */
export function buildMarketingBootScript({ includeSessionRedirect = false } = {}) {
  const key = JSON.stringify(PERSISTED_SESSION_HINT_STORAGE_KEY);
  const sessionBlock = includeSessionRedirect
    ? `try{if(localStorage.getItem(${key})==='1'){location.replace('/dashboard');return;}}catch(e){}`
    : '';
  return `<script ${MARKETING_STATIC_PAGE_MARKER}-boot="true">
(function(){
  ${sessionBlock}
  try{
    var q=new URLSearchParams(location.search);
    if(q.get('login')==='true'){
      var next='/login';
      if(q.get('signup')==='1') next='/login?signup=1';
      location.replace(next);
    }
  }catch(e){}
})();
</script>`;
}

/**
 * Visible marketing body (replaces SPA #root content).
 * @param {{ path: string, h1: string, paragraphs: string[] }} route
 */
export function buildMarketingStaticBody(route) {
  const paras = (route.paragraphs || [])
    .map((p, i) => {
      const cls = i === 0 ? 'msp-lead' : 'msp-p';
      return `<p class="${cls}">${escapeHtml(p)}</p>`;
    })
    .join('\n');

  const nav = NAV.map(
    (item) =>
      `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`,
  ).join('');

  const isHome = route.path === '/';
  const primaryCta = isHome
    ? { href: '/login?signup=1', label: 'Create account' }
    : { href: '/login?signup=1', label: 'Join free' };
  const secondaryCta = { href: '/login', label: 'Sign in' };

  return [
    `<style id="marketing-static-page-css">${criticalCss()}</style>`,
    `<div ${MARKETING_STATIC_PAGE_MARKER}="true">`,
    `<div class="msp-ambient" aria-hidden="true"></div>`,
    `<div class="msp-inner">`,
    `<a class="msp-brand" href="/">Setlist Pick'em</a>`,
    `<ul class="msp-nav">${nav}</ul>`,
    `<main data-seo-prerender="true">`,
    `<!--seo-prerender:${escapeHtml(route.path)}-->`,
    `<h1 class="msp-h1">${escapeHtml(route.h1)}</h1>`,
    paras,
    `<div class="msp-cta-row">`,
    `<a class="msp-cta msp-cta--primary" href="${escapeHtml(primaryCta.href)}">${escapeHtml(primaryCta.label)}</a>`,
    `<a class="msp-cta msp-cta--secondary" href="${escapeHtml(secondaryCta.href)}">${escapeHtml(secondaryCta.label)}</a>`,
    `</div>`,
    `</main>`,
    `<footer class="msp-footer">`,
    `<a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>`,
    `</footer>`,
    `</div></div>`,
  ].join('\n');
}

/**
 * Remove Vite SPA entry + modulepreloads so the document cannot boot the app.
 * @param {string} html
 */
export function stripSpaRuntimeFromHtml(html) {
  if (typeof html !== 'string' || !html) return html;
  let out = html;
  out = out.replace(
    /<script\b[^>]*\btype=["']module["'][^>]*>\s*<\/script>/gi,
    '',
  );
  out = out.replace(/<script\b[^>]*\btype=["']module["'][^>]*><\/script>/gi, '');
  out = out.replace(
    /<link\b[^>]*\brel=["']modulepreload["'][^>]*>/gi,
    '',
  );
  // Full Tailwind bundle is unnecessary — critical CSS is inlined on the page.
  out = out.replace(
    /<link\b[^>]*\brel=["']stylesheet["'][^>]*\/assets\/index-[^"']+\.css[^>]*>/gi,
    '',
  );
  // Drop prior SPA-era marketing boot overlay markers if re-running.
  out = out.replace(
    /<style id="marketing-boot-shell-css">[\s\S]*?<\/style>/gi,
    '',
  );
  out = out.replace(
    /<div[^>]*data-marketing-boot-shell=["']true["'][^>]*>[\s\S]*?<\/div>/gi,
    '',
  );
  return out;
}
