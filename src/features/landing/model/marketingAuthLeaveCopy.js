/** Destination-aware leave chrome while marketing hard-navs to `/login` (#872). */

export const MARKETING_LEAVE_SIGN_IN = 'Taking you to sign in…';
export const MARKETING_LEAVE_SIGN_UP = 'Taking you to sign up…';

/**
 * @param {{ signup?: boolean }} [opts]
 * @returns {string}
 */
export function resolveMarketingAuthLeaveMessage({ signup = false } = {}) {
  return signup ? MARKETING_LEAVE_SIGN_UP : MARKETING_LEAVE_SIGN_IN;
}
