/**
 * Marketing → `/login` intent prefetch (#860 / Tier 2).
 *
 * Warms the login document + LoginPage UI modulepreload URLs into the browser
 * cache without calling `initializeApp` / mounting AuthProvider on marketing `/`.
 * Firebase chunks are intentionally excluded so cold marketing Network stays
 * firebase-free until the user leaves for `/login` (login shell may modulepreload
 * firebase-core itself).
 */

export const LOGIN_WARM_INTENT_STORAGE_KEY = 'setpicks_login_warm_intent_v1';

const PREFETCH_ATTR = 'data-login-intent-prefetch';

/** @type {boolean} */
let prefetchStarted = false;

/**
 * Mark that marketing CTA intent contributed to the upcoming `/login` warm.
 * Consumed once by LoginPage for `auth_surface_timing.warm_path=intent`.
 */
export function markLoginWarmIntent() {
  try {
    sessionStorage.setItem(LOGIN_WARM_INTENT_STORAGE_KEY, '1');
  } catch {
    // ignore quota / private mode
  }
}

/**
 * @returns {boolean} true when marketing intent prefetch ran this tab session
 */
export function consumeLoginWarmIntent() {
  try {
    const raw = sessionStorage.getItem(LOGIN_WARM_INTENT_STORAGE_KEY);
    sessionStorage.removeItem(LOGIN_WARM_INTENT_STORAGE_KEY);
    return raw === '1';
  } catch {
    return false;
  }
}

/**
 * @returns {boolean}
 */
export function peekLoginWarmIntent() {
  try {
    return sessionStorage.getItem(LOGIN_WARM_INTENT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Inject `<link rel="prefetch">` for an href (idempotent per href).
 * @param {string} href
 * @param {'script' | 'document' | undefined} [as]
 */
export function injectLoginIntentPrefetchLink(href, as) {
  if (typeof document === 'undefined' || !href) return;
  const existing = document.querySelectorAll(`link[${PREFETCH_ATTR}]`);
  for (const node of existing) {
    if (node.getAttribute('href') === href) return;
  }
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  if (as) link.as = as;
  link.setAttribute(PREFETCH_ATTR, 'true');
  document.head.appendChild(link);
}

/**
 * Parse login shell HTML for modulepreload / module script asset hrefs.
 * Drops firebase-* so marketing never pulls Auth into Network before leave.
 *
 * @param {string} html
 * @returns {string[]}
 */
export function extractLoginUiAssetHrefs(html) {
  if (typeof html !== 'string' || !html) return [];
  const hrefs = new Set();
  const patterns = [
    /<link[^>]*rel=["']modulepreload["'][^>]*href=["'](\/assets\/[^"']+)["'][^>]*>/gi,
    /<link[^>]*href=["'](\/assets\/[^"']+)["'][^>]*rel=["']modulepreload["'][^>]*>/gi,
    /<script[^>]*type=["']module["'][^>]*src=["'](\/assets\/[^"']+)["'][^>]*>/gi,
  ];
  for (const re of patterns) {
    for (const match of html.matchAll(re)) {
      const href = match[1];
      if (!href || /\/assets\/firebase/i.test(href)) continue;
      hrefs.add(href);
    }
  }
  return [...hrefs];
}

/**
 * Prefetch `/login` document + non-Firebase login UI assets.
 * Safe to call from pointerenter / focus / click leave — idempotent.
 */
export function prefetchLoginIntent() {
  markLoginWarmIntent();
  if (typeof document === 'undefined') return;
  if (prefetchStarted) return;
  prefetchStarted = true;

  injectLoginIntentPrefetchLink('/login', 'document');

  void (async () => {
    try {
      const res = await fetch('/login', {
        credentials: 'same-origin',
        // Hint only — unsupported browsers ignore.
        priority: 'low',
      });
      if (!res.ok) return;
      const html = await res.text();
      for (const href of extractLoginUiAssetHrefs(html)) {
        injectLoginIntentPrefetchLink(href, 'script');
      }
    } catch {
      // Prefetch is best-effort; leave chrome + login warm still cover the hop.
    }
  })();
}

/** @internal vitest */
export function resetPrefetchLoginIntentForTests() {
  prefetchStarted = false;
  try {
    sessionStorage.removeItem(LOGIN_WARM_INTENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
