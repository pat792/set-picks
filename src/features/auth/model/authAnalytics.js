import { ga4Event } from '../../../shared/lib/ga4';

/** @typedef {'sign_in' | 'create_account'} AuthModalSurface */
/** @typedef {'immediate' | 'idle' | 'intent'} AuthWarmPath */
/** @typedef {'popup' | 'redirect'} AuthFlow */
/** @typedef {'success' | 'error'} AuthTimingOutcome */

/** Drop absurd outliers (tab backgrounded, etc.) — AUTH_SEAMLESS_PATH §7.2 */
export const AUTH_TIMING_MAX_MS = 60_000;

function mirrorAuthTelemetry(event, params) {
  if (import.meta.env.DEV) {
    console.info(`[telemetry] ${event}`, params);
  }
}

/**
 * Round and cap timing ms for GA4. Returns null when the sample should be omitted.
 * @param {number} ms
 * @returns {number | null}
 */
export function clampAuthTimingMs(ms) {
  if (!Number.isFinite(ms) || ms < 0) return null;
  const rounded = Math.round(ms);
  if (rounded > AUTH_TIMING_MAX_MS) return null;
  return rounded;
}

/**
 * @param {{
 *   valueMs: number,
 *   warmPath?: AuthWarmPath,
 *   navigationType?: string,
 * }} input
 * @returns {Record<string, string | number> | null}
 */
export function buildAuthSurfaceTimingParams(input) {
  const value = clampAuthTimingMs(input.valueMs);
  if (value == null) return null;
  return {
    phase: 'paint_to_ready',
    value,
    route_group: 'login',
    warm_path: input.warmPath || 'idle',
    navigation_type: input.navigationType || 'navigate',
  };
}

/**
 * @param {{
 *   phase: 'click_to_popup' | 'credential_to_nav',
 *   valueMs: number,
 *   authFlow?: AuthFlow,
 *   outcome: AuthTimingOutcome,
 *   errorCode?: string,
 * }} input
 * @returns {Record<string, string | number> | null}
 */
export function buildAuthGoogleTimingParams(input) {
  const value = clampAuthTimingMs(input.valueMs);
  if (value == null) return null;
  return {
    phase: input.phase,
    value,
    method: 'google',
    auth_flow: input.authFlow || 'popup',
    outcome: input.outcome,
    ...(input.errorCode ? { error_code: input.errorCode } : {}),
  };
}

/**
 * @param {string} method
 * @param {{ surface?: AuthModalSurface, auth_flow?: 'popup' | 'redirect' }} [opts]
 */
export function trackAuthSignUp(method, opts = {}) {
  const params = {
    method,
    ...(opts.surface ? { surface: opts.surface } : {}),
    ...(opts.auth_flow ? { auth_flow: opts.auth_flow } : {}),
  };
  mirrorAuthTelemetry('sign_up', params);
  ga4Event('sign_up', params);
}

/**
 * @param {string} method
 * @param {{ surface?: AuthModalSurface, auth_flow?: 'popup' | 'redirect' }} [opts]
 */
export function trackAuthLogin(method, opts = {}) {
  const params = {
    method,
    ...(opts.surface ? { surface: opts.surface } : {}),
    ...(opts.auth_flow ? { auth_flow: opts.auth_flow } : {}),
  };
  mirrorAuthTelemetry('login', params);
  ga4Event('login', params);
}

/**
 * @param {{
 *   method: string,
 *   error_code?: string,
 *   surface?: AuthModalSurface,
 *   auth_flow?: 'popup' | 'redirect',
 * }} payload
 */
export function trackAuthError(payload) {
  const params = {
    method: payload.method,
    error_code: payload.error_code ?? 'unknown',
    ...(payload.surface ? { surface: payload.surface } : {}),
    ...(payload.auth_flow ? { auth_flow: payload.auth_flow } : {}),
  };
  mirrorAuthTelemetry('auth_error', params);
  ga4Event('auth_error', params);
}

/**
 * Anomaly signal: a `users/{uid}` doc exists for the signed-in caller but
 * is missing `handle` (the sentinel for completed profile setup). The
 * canonical case is the May 2026 consent-only orphan bug (PR #399). Wire
 * this event as a custom alert in GA4 — a non-zero daily count should page
 * the on-call.
 *
 * @param {{ has_consent: boolean, surface: 'dashboard_route' }} payload
 */
export function trackAuthPartialProfile(payload) {
  const params = {
    has_consent: payload.has_consent ? 'true' : 'false',
    surface: payload.surface,
  };
  mirrorAuthTelemetry('auth_partial_profile', params);
  ga4Event('auth_partial_profile', params);
}

/**
 * Fires when post-sign-up Firestore writes fail and we initiate an Auth
 * rollback (`deleteAuthUserIfPresent`). Gives us a numerator for
 * "signup attempts that failed after Auth account creation" without
 * conflating with normal `auth_error` cases (wrong-password etc.).
 *
 * @param {{ method: 'email' | 'google', stage: 'consent_write' }} payload
 */
export function trackAuthRollback(payload) {
  const params = {
    method: payload.method,
    stage: payload.stage,
  };
  mirrorAuthTelemetry('auth_rollback', params);
  ga4Event('auth_rollback', params);
}

/**
 * Fires when the rollback `deleteUser` call itself fails — historically
 * swallowed by a bare `catch {}` and effectively invisible. A non-zero
 * count means we have phantom Firebase Auth accounts (no Firestore doc,
 * no consent record) accumulating. Pair with the
 * `repairConsentOnlyUser` / `diagnoseUserDoc` scripts under
 * `functions/scripts/` to clean up.
 *
 * @param {{ method: 'email' | 'google', error_code: string }} payload
 */
export function trackAuthRollbackFailed(payload) {
  const params = {
    method: payload.method,
    error_code: payload.error_code,
  };
  mirrorAuthTelemetry('auth_rollback_failed', params);
  ga4Event('auth_rollback_failed', params);
}

/**
 * `/login` Auth surface ready (paint → warm complete). Once per visit (#857).
 * @param {{
 *   valueMs: number,
 *   warmPath?: AuthWarmPath,
 *   navigationType?: string,
 * }} payload
 */
export function trackAuthSurfaceTiming(payload) {
  const params = buildAuthSurfaceTimingParams(payload);
  if (!params) return;
  mirrorAuthTelemetry('auth_surface_timing', params);
  ga4Event('auth_surface_timing', params);
}

/**
 * Google OAuth interaction timing on `/login` (#857).
 * @param {{
 *   phase: 'click_to_popup' | 'credential_to_nav',
 *   valueMs: number,
 *   authFlow?: AuthFlow,
 *   outcome: AuthTimingOutcome,
 *   errorCode?: string,
 * }} payload
 */
export function trackAuthGoogleTiming(payload) {
  const params = buildAuthGoogleTimingParams(payload);
  if (!params) return;
  mirrorAuthTelemetry('auth_google_timing', params);
  ga4Event('auth_google_timing', params);
}
