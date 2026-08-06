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

  it('maps login, marketing, and public tour-stats (#857)', () => {
    expect(resolveRouteGroup('/login')).toBe('login');
    expect(resolveRouteGroup('/login/')).toBe('login');
    expect(resolveRouteGroup('/how-it-works')).toBe('marketing');
    expect(resolveRouteGroup('/how-scoring-works')).toBe('marketing');
    expect(resolveRouteGroup('/phish-setlist-prediction-game')).toBe('marketing');
    expect(resolveRouteGroup('/tour-stats')).toBe('tour_stats');
    expect(resolveRouteGroup('/tour-stats/song/foo')).toBe('tour_stats');
  });

  it('maps unknown paths to other', () => {
    expect(resolveRouteGroup('/privacy')).toBe('marketing');
    expect(resolveRouteGroup('/terms')).toBe('marketing');
    expect(resolveRouteGroup('')).toBe('other');
    expect(resolveRouteGroup(undefined)).toBe('other');
  });
});
