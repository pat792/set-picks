import { describe, expect, it } from 'vitest';

import { shouldDeferFirebaseBoot } from './ensureFirebase.js';

describe('shouldDeferFirebaseBoot', () => {
  it('defers only anon /login', () => {
    expect(shouldDeferFirebaseBoot('/login')).toBe(true);
    expect(shouldDeferFirebaseBoot('/login', { hasSession: false })).toBe(true);
  });

  it('does not defer with session hint or redirect intent', () => {
    expect(shouldDeferFirebaseBoot('/login', { hasSession: true })).toBe(false);
    expect(shouldDeferFirebaseBoot('/login', { hasRedirectIntent: true })).toBe(
      false,
    );
  });

  it('never defers dashboard, setup, or other paths', () => {
    expect(shouldDeferFirebaseBoot('/dashboard')).toBe(false);
    expect(shouldDeferFirebaseBoot('/setup')).toBe(false);
    expect(shouldDeferFirebaseBoot('/')).toBe(false);
    expect(shouldDeferFirebaseBoot('/join/ABC')).toBe(false);
    expect(shouldDeferFirebaseBoot('')).toBe(false);
    expect(shouldDeferFirebaseBoot(undefined)).toBe(false);
  });
});
