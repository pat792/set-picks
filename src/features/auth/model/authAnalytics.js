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
