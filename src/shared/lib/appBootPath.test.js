import { describe, expect, it } from 'vitest';

import { isDashboardEntryPath, shouldWarmAppCheckOnBoot } from './appBootPath.js';

describe('isDashboardEntryPath', () => {
  it('matches /dashboard and nested paths', () => {
    expect(isDashboardEntryPath('/dashboard')).toBe(true);
    expect(isDashboardEntryPath('/dashboard/')).toBe(true);
    expect(isDashboardEntryPath('/dashboard/picks')).toBe(true);
  });

  it('rejects non-dashboard paths', () => {
    expect(isDashboardEntryPath('/')).toBe(false);
    expect(isDashboardEntryPath('/setup')).toBe(false);
    expect(isDashboardEntryPath('/dashboarding')).toBe(false);
    expect(isDashboardEntryPath('')).toBe(false);
    expect(isDashboardEntryPath(undefined)).toBe(false);
  });
});

describe('shouldWarmAppCheckOnBoot', () => {
  it('warms dashboard, setup, join, and invite', () => {
    expect(shouldWarmAppCheckOnBoot('/dashboard/standings')).toBe(true);
    expect(shouldWarmAppCheckOnBoot('/setup')).toBe(true);
    expect(shouldWarmAppCheckOnBoot('/join/ABC')).toBe(true);
    expect(shouldWarmAppCheckOnBoot('/invite/pat')).toBe(true);
  });

  it('does not warm splash or marketing', () => {
    expect(shouldWarmAppCheckOnBoot('/')).toBe(false);
    expect(shouldWarmAppCheckOnBoot('/how-it-works')).toBe(false);
    expect(shouldWarmAppCheckOnBoot('/privacy')).toBe(false);
  });
});
