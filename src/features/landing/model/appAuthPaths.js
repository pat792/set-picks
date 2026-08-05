/**
 * App-document auth entry URLs (#832 / #872).
 * Marketing must hard-nav here — never soft-route through MarketingApp.
 */

export const LOGIN_PATH = '/login';
export const LOGIN_SIGNUP_PATH = '/login?mode=signup';

/**
 * @param {{ signup?: boolean }} [opts]
 * @returns {string}
 */
export function loginPath({ signup = false } = {}) {
  return signup ? LOGIN_SIGNUP_PATH : LOGIN_PATH;
}
