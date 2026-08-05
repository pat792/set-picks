/**
 * Performance marks + GA4 timing for `/login` Google auth (#857).
 * Marks are best-effort; emitters no-op off prod host via ga4Event.
 */

import { resolveNavigationType } from '../../../shared/lib/webVitals';
import {
  trackAuthGoogleTiming,
  trackAuthSurfaceTiming,
} from './authAnalytics';

export const AUTH_LOGIN_PAINT_MARK = 'auth_login_paint';
export const AUTH_SURFACE_READY_MARK = 'auth_surface_ready';
export const AUTH_GOOGLE_CLICK_MARK = 'auth_google_click';
export const AUTH_GOOGLE_OAUTH_START_MARK = 'auth_google_oauth_start';

let paintMarked = false;
let surfaceTimingSent = false;
/** @type {number | null} */
let googleClickAt = null;
/** @type {number | null} */
let googleOauthStartAt = null;

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function safeMark(name) {
  try {
    performance?.mark?.(name);
  } catch {
    // ignore
  }
}

/**
 * Call once when `/login` form paints (before idle warm).
 */
export function markLoginAuthPaint() {
  if (paintMarked) return;
  paintMarked = true;
  safeMark(AUTH_LOGIN_PAINT_MARK);
}

/**
 * Emit `auth_surface_timing` once when Auth warm completes.
 * @param {{ warmPath?: 'immediate' | 'idle' | 'intent' }} [opts]
 */
export function reportLoginAuthSurfaceReady(opts = {}) {
  if (surfaceTimingSent) return;
  surfaceTimingSent = true;
  safeMark(AUTH_SURFACE_READY_MARK);
  const paintAt = (() => {
    try {
      const entry = performance
        ?.getEntriesByName?.(AUTH_LOGIN_PAINT_MARK, 'mark')
        ?.[0];
      return entry?.startTime ?? null;
    } catch {
      return null;
    }
  })();
  const readyAt = nowMs();
  const valueMs = paintAt == null ? readyAt : readyAt - paintAt;
  trackAuthSurfaceTiming({
    valueMs,
    warmPath: opts.warmPath || 'idle',
    navigationType: resolveNavigationType(),
  });
}

/**
 * Mark Google CTA click (start of click_to_popup).
 */
export function markGoogleAuthClick() {
  googleClickAt = nowMs();
  googleOauthStartAt = null;
  safeMark(AUTH_GOOGLE_CLICK_MARK);
}

/**
 * Mark immediately before `signInWithPopup` / `signInWithRedirect`.
 */
export function markGoogleOauthStart() {
  googleOauthStartAt = nowMs();
  safeMark(AUTH_GOOGLE_OAUTH_START_MARK);
}

/**
 * Emit click→OAuth timing after the Google attempt settles.
 * @param {{
 *   authFlow: 'popup' | 'redirect',
 *   outcome: 'success' | 'error',
 *   errorCode?: string,
 * }} payload
 */
export function trackGoogleClickToOauthTiming(payload) {
  if (googleClickAt == null || googleOauthStartAt == null) return;
  trackAuthGoogleTiming({
    phase: 'click_to_popup',
    valueMs: googleOauthStartAt - googleClickAt,
    authFlow: payload.authFlow,
    outcome: payload.outcome,
    errorCode: payload.errorCode,
  });
}

/**
 * Emit OAuth-start → leave-login timing on success.
 * @param {{ authFlow: 'popup' | 'redirect' }} payload
 */
export function trackGoogleCredentialToNavTiming(payload) {
  if (googleOauthStartAt == null) return;
  trackAuthGoogleTiming({
    phase: 'credential_to_nav',
    valueMs: nowMs() - googleOauthStartAt,
    authFlow: payload.authFlow,
    outcome: 'success',
  });
}

/** @visibleForTesting */
export function resetAuthLoginTimingForTests() {
  paintMarked = false;
  surfaceTimingSent = false;
  googleClickAt = null;
  googleOauthStartAt = null;
}
