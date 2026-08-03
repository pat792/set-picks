import { describe, expect, it } from 'vitest';

import {
  isDashboardEntryPath,
  isPublicColdOpenPath,
  shouldWarmAppCheckOnBoot,
} from './appBootPath.js';

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

describe('isPublicColdOpenPath', () => {
  it('matches splash, join, and site invite', () => {
    expect(isPublicColdOpenPath('/')).toBe(true);
    expect(isPublicColdOpenPath('/join/ABC')).toBe(true);
    expect(isPublicColdOpenPath('/invite/pat')).toBe(true);
  });

  it('rejects dashboard, setup, marketing', () => {
    expect(isPublicColdOpenPath('/dashboard')).toBe(false);
    expect(isPublicColdOpenPath('/setup')).toBe(false);
    expect(isPublicColdOpenPath('/how-it-works')).toBe(false);
  });
});

describe('shouldWarmAppCheckOnBoot', () => {
  it('warms dashboard and setup only (#803)', () => {
    expect(shouldWarmAppCheckOnBoot('/dashboard/standings')).toBe(true);
    expect(shouldWarmAppCheckOnBoot('/setup')).toBe(true);
  });

  it('does not warm anonymous cold-open or marketing', () => {
    expect(shouldWarmAppCheckOnBoot('/')).toBe(false);
    expect(shouldWarmAppCheckOnBoot('/join/ABC')).toBe(false);
    expect(shouldWarmAppCheckOnBoot('/invite/pat')).toBe(false);
    expect(shouldWarmAppCheckOnBoot('/how-it-works')).toBe(false);
    expect(shouldWarmAppCheckOnBoot('/privacy')).toBe(false);
  });
});
