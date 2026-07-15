import { ga4Event } from '../../../shared/lib/ga4';

/** @typedef {'sign_in' | 'create_account'} AuthModalSurface */

function mirrorAuthTelemetry(event, params) {
  if (import.meta.env.DEV) {
    console.info(`[telemetry] ${event}`, params);
  }
}

/**
 * @param {string} method
 * @param {{ surface?: AuthModalSurface }} [opts]
 */
export function trackAuthSignUp(method, opts = {}) {
  const params = {
    method,
    ...(opts.surface ? { surface: opts.surface } : {}),
  };
  mirrorAuthTelemetry('sign_up', params);
  ga4Event('sign_up', params);
}

/**
 * @param {string} method
 * @param {{ surface?: AuthModalSurface }} [opts]
 */
export function trackAuthLogin(method, opts = {}) {
  const params = {
    method,
    ...(opts.surface ? { surface: opts.surface } : {}),
  };
  mirrorAuthTelemetry('login', params);
  ga4Event('login', params);
}

/**
 * @param {{ method: string, error_code?: string, surface?: AuthModalSurface }} payload
 */
export function trackAuthError(payload) {
  const params = {
    method: payload.method,
    error_code: payload.error_code ?? 'unknown',
    ...(payload.surface ? { surface: payload.surface } : {}),
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
