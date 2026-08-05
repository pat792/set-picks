/**
 * Marketing → `/login` download warm (#860 intent / #880 speculative).
 *
 * Warms the login document + LoginPage UI modulepreload URLs into the browser
 * cache without calling `initializeApp` / mounting AuthProvider on marketing `/`.
 *
 * - **Intent (#860):** CTA pointer/focus/leave — UI assets only (all `firebase-*` dropped).
 * - **Speculative (#880):** post-paint idle — UI assets + `firebase-core` only
 *   (still drop App Check / Storage). Download only; execute stays on `/login`.
 */

export const LOGIN_WARM_INTENT_STORAGE_KEY = 'setpicks_login_warm_intent_v1';
export const LOGIN_WARM_SPECULATIVE_STORAGE_KEY =
  'setpicks_login_warm_speculative_v1';
export const LOGIN_HOP_CTA_STORAGE_KEY = 'setpicks_login_hop_cta_v1';

const PREFETCH_ATTR = 'data-login-intent-prefetch';

/** Default idle timeout for speculative warm (ms). */
export const SPECULATIVE_LOGIN_WARM_IDLE_TIMEOUT_MS = 2000;

/** @type {Promise<string | null> | null} */
let loginHtmlFetchPromise = null;

/** @type {boolean} */
let speculativeScheduleStarted = false;

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
 * Mark that idle speculative warm contributed (#880).
 * Consumed once by LoginPage for `auth_surface_timing.warm_path=speculative`
 * when intent did not also run.
 */
export function markLoginWarmSpeculative() {
  try {
    sessionStorage.setItem(LOGIN_WARM_SPECULATIVE_STORAGE_KEY, '1');
  } catch {
    // ignore quota / private mode
  }
}

/**
 * @returns {boolean}
 */
export function consumeLoginWarmSpeculative() {
  try {
    const raw = sessionStorage.getItem(LOGIN_WARM_SPECULATIVE_STORAGE_KEY);
    sessionStorage.removeItem(LOGIN_WARM_SPECULATIVE_STORAGE_KEY);
    return raw === '1';
  } catch {
    return false;
  }
}

/**
 * @returns {boolean}
 */
export function peekLoginWarmSpeculative() {
  try {
    return sessionStorage.getItem(LOGIN_WARM_SPECULATIVE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Resolve warm_path for `/login`: intent > speculative > immediate.
 * Consumes both session flags (so a leftover speculative mark cannot leak).
 * @returns {'intent' | 'speculative' | 'immediate'}
 */
export function consumeLoginWarmPath() {
  const intent = consumeLoginWarmIntent();
  const speculative = consumeLoginWarmSpeculative();
  if (intent) return 'intent';
  if (speculative) return 'speculative';
  return 'immediate';
}

/**
 * Stamp marketing CTA click for cross-document `auth_hop_timing` (#880).
 * Uses wall-clock ms — `performance.now()` does not survive document swap.
 * @param {{ intent?: 'signin' | 'signup' }} [opts]
 */
export function markLoginHopCta(opts = {}) {
  try {
    const intent = opts.intent === 'signup' ? 'signup' : 'signin';
    sessionStorage.setItem(
      LOGIN_HOP_CTA_STORAGE_KEY,
      JSON.stringify({ t: Date.now(), intent }),
    );
  } catch {
    // ignore
  }
}

/**
 * @returns {{ t: number, intent: 'signin' | 'signup' } | null}
 */
export function consumeLoginHopCta() {
  try {
    const raw = sessionStorage.getItem(LOGIN_HOP_CTA_STORAGE_KEY);
    sessionStorage.removeItem(LOGIN_HOP_CTA_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const t = Number(parsed?.t);
    if (!Number.isFinite(t) || t <= 0) return null;
    const intent = parsed?.intent === 'signup' ? 'signup' : 'signin';
    return { t, intent };
  } catch {
    return null;
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
 * Whether an `/assets/…` href should be prefetched for the given mode.
 * @param {string} href
 * @param {{ includeFirebaseCore?: boolean }} [opts]
 * @returns {boolean}
 */
export function shouldPrefetchLoginAssetHref(href, opts = {}) {
  if (!href) return false;
  if (!/\/assets\/firebase/i.test(href)) return true;
  if (!opts.includeFirebaseCore) return false;
  // Allow firebase-core only — drop App Check, Storage, etc.
  return /\/assets\/firebase-core/i.test(href);
}

/**
 * Parse login shell HTML for modulepreload / module script asset hrefs.
 *
 * @param {string} html
 * @param {{ includeFirebaseCore?: boolean }} [opts]
 *   When `includeFirebaseCore` is true (speculative #880), keep `firebase-core`.
 *   Intent path (#860) defaults to dropping all `firebase-*`.
 * @returns {string[]}
 */
export function extractLoginUiAssetHrefs(html, opts = {}) {
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
      if (!shouldPrefetchLoginAssetHref(href, opts)) continue;
      hrefs.add(href);
    }
  }
  return [...hrefs];
}

/**
 * @returns {boolean} true when Save-Data / data-saver should skip idle warm
 */
export function shouldSkipSpeculativeLoginWarm() {
  try {
    if (typeof navigator !== 'undefined' && navigator.connection?.saveData) {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Shared download warm: `/login` document + asset hrefs from the shell.
 * Idempotent fetch; later calls can inject additional hrefs (e.g. firebase-core
 * after an earlier intent-only pass).
 *
 * @param {{ includeFirebaseCore?: boolean }} [opts]
 * @returns {Promise<void>}
 */
export async function prefetchLoginAssets(opts = {}) {
  if (typeof document === 'undefined') return;
  const includeFirebaseCore = Boolean(opts.includeFirebaseCore);

  injectLoginIntentPrefetchLink('/login', 'document');

  if (!loginHtmlFetchPromise) {
    loginHtmlFetchPromise = (async () => {
      try {
        const res = await fetch('/login', {
          credentials: 'same-origin',
          // Hint only — unsupported browsers ignore.
          priority: 'low',
        });
        if (!res.ok) return null;
        return await res.text();
      } catch {
        return null;
      }
    })();
  }

  try {
    const html = await loginHtmlFetchPromise;
    if (!html) return;
    for (const href of extractLoginUiAssetHrefs(html, { includeFirebaseCore })) {
      injectLoginIntentPrefetchLink(href, 'script');
    }
  } catch {
    // Prefetch is best-effort; leave chrome + login warm still cover the hop.
  }
}

/**
 * Prefetch `/login` document + non-Firebase login UI assets (CTA intent).
 * Safe to call from pointerenter / focus / click leave — idempotent fetch.
 */
export function prefetchLoginIntent() {
  markLoginWarmIntent();
  void prefetchLoginAssets({ includeFirebaseCore: false });
}

/**
 * Idle speculative warm: login UI + `firebase-core` download only (#880).
 * Once per marketing document load (caller schedules); skip on Save-Data.
 * @returns {boolean} true when warm was started
 */
export function prefetchLoginSpeculative() {
  if (shouldSkipSpeculativeLoginWarm()) return false;
  markLoginWarmSpeculative();
  void prefetchLoginAssets({ includeFirebaseCore: true });
  return true;
}

/**
 * Schedule speculative warm after paint via `requestIdleCallback` (timeout fallback).
 * Idempotent for the marketing document lifetime.
 *
 * @param {{ timeoutMs?: number }} [opts]
 * @returns {() => void} cancel
 */
export function scheduleSpeculativeLoginWarm(opts = {}) {
  if (typeof window === 'undefined') return () => {};
  if (speculativeScheduleStarted) return () => {};
  speculativeScheduleStarted = true;

  const timeoutMs = opts.timeoutMs ?? SPECULATIVE_LOGIN_WARM_IDLE_TIMEOUT_MS;
  let cancelled = false;
  /** @type {number | null} */
  let idleId = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timerId = null;

  const run = () => {
    if (cancelled) return;
    prefetchLoginSpeculative();
  };

  if (typeof window.requestIdleCallback === 'function') {
    idleId = window.requestIdleCallback(run, { timeout: timeoutMs });
  } else {
    timerId = setTimeout(run, Math.min(timeoutMs, 1500));
  }

  return () => {
    cancelled = true;
    if (
      idleId != null &&
      typeof window.cancelIdleCallback === 'function'
    ) {
      window.cancelIdleCallback(idleId);
    }
    if (timerId != null) clearTimeout(timerId);
  };
}

/** @internal vitest */
export function resetPrefetchLoginIntentForTests() {
  loginHtmlFetchPromise = null;
  speculativeScheduleStarted = false;
  try {
    sessionStorage.removeItem(LOGIN_WARM_INTENT_STORAGE_KEY);
    sessionStorage.removeItem(LOGIN_WARM_SPECULATIVE_STORAGE_KEY);
    sessionStorage.removeItem(LOGIN_HOP_CTA_STORAGE_KEY);
  } catch {
    // ignore
  }
}
