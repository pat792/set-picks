import { describe, expect, it } from 'vitest';

import { resolveRouteGroup } from './routeGroup.js';

describe('resolveRouteGroup', () => {
  it('maps cold-open surfaces', () => {
    expect(resolveRouteGroup('/')).toBe('splash');
    expect(resolveRouteGroup('/join/ABC')).toBe('invite_join');
    expect(resolveRouteGroup('/invite/pat')).toBe('invite_site');
    expect(resolveRouteGroup('/dashboard')).toBe('dashboard');
    expect(resolveRouteGroup('/dashboard/picks')).toBe('dashboard');
    expect(resolveRouteGroup('/setup')).toBe('setup');
  });

  it('maps marketing / unknown to other', () => {
    expect(resolveRouteGroup('/how-it-works')).toBe('other');
    expect(resolveRouteGroup('/privacy')).toBe('other');
    expect(resolveRouteGroup('')).toBe('other');
    expect(resolveRouteGroup(undefined)).toBe('other');
  });
});
