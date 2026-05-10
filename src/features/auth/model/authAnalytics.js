import { ga4Event } from '../../../shared/lib/ga4';

export function trackAuthSignUp(method) {
  ga4Event('sign_up', { method });
}

export function trackAuthLogin(method) {
  ga4Event('login', { method });
}

/**
 * @param {{ method: string, error_code?: string }} payload
 */
export function trackAuthError(payload) {
  ga4Event('auth_error', {
    method: payload.method,
    error_code: payload.error_code ?? 'unknown',
  });
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
  ga4Event('auth_partial_profile', {
    has_consent: payload.has_consent ? 'true' : 'false',
    surface: payload.surface,
  });
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
  ga4Event('auth_rollback', {
    method: payload.method,
    stage: payload.stage,
  });
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
  ga4Event('auth_rollback_failed', {
    method: payload.method,
    error_code: payload.error_code,
  });
}
