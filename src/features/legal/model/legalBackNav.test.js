import { describe, expect, it } from 'vitest';

import { resolveLegalBackNav } from './legalBackNav';

describe('resolveLegalBackNav', () => {
  it('returns create-account for signup resume', () => {
    expect(resolveLegalBackNav('signup')).toEqual({
      href: '/login?mode=signup',
      label: 'Back to create account',
      hardNav: true,
    });
  });

  it('returns sign-in for signin resume', () => {
    expect(resolveLegalBackNav('signin')).toEqual({
      href: '/login',
      label: 'Back to sign in',
      hardNav: true,
    });
  });

  it('defaults to marketing home', () => {
    expect(resolveLegalBackNav(null).href).toBe('/');
    expect(resolveLegalBackNav(undefined).hardNav).toBe(false);
  });
});
