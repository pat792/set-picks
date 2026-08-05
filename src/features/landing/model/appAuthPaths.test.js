import { describe, expect, it } from 'vitest';

import { LOGIN_PATH, LOGIN_SIGNUP_PATH, loginPath } from './appAuthPaths.js';

describe('loginPath', () => {
  it('defaults to sign-in', () => {
    expect(loginPath()).toBe(LOGIN_PATH);
    expect(loginPath({ signup: false })).toBe(LOGIN_PATH);
  });

  it('returns signup query for create-account CTAs', () => {
    expect(loginPath({ signup: true })).toBe(LOGIN_SIGNUP_PATH);
  });
});
