import { describe, expect, it } from 'vitest';

import { shellTransitionKey } from './shellTransitionKey';

describe('shellTransitionKey', () => {
  it('keeps dashboard nested paths on one key', () => {
    expect(shellTransitionKey('/dashboard')).toBe('/dashboard');
    expect(shellTransitionKey('/dashboard/')).toBe('/dashboard');
    expect(shellTransitionKey('/dashboard/profile')).toBe('/dashboard');
    expect(shellTransitionKey('/dashboard/profile/account')).toBe('/dashboard');
    expect(shellTransitionKey('/dashboard/pools')).toBe('/dashboard');
    expect(shellTransitionKey('/dashboard/pool/abc123')).toBe('/dashboard');
  });

  it('changes key across top-level routes', () => {
    expect(shellTransitionKey('/')).not.toBe(shellTransitionKey('/dashboard'));
    expect(shellTransitionKey('/how-it-works')).not.toBe(shellTransitionKey('/privacy'));
  });

  it('groups pool invite deep links', () => {
    expect(shellTransitionKey('/join/POOL1')).toBe('/join/:code');
    expect(shellTransitionKey('/join/abc/')).toBe('/join/:code');
  });

  it('groups site invite deep links', () => {
    expect(shellTransitionKey('/invite/Mikey')).toBe('/invite/:handle');
    expect(shellTransitionKey('/invite/mikey/')).toBe('/invite/:handle');
  });
});
