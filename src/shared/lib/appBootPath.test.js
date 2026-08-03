import { describe, expect, it } from 'vitest';

import {
  isDashboardEntryPath,
  isPublicColdOpenPath,
  shouldPrefetchDashboardOnBoot,
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

describe('shouldPrefetchDashboardOnBoot', () => {
  it('always prefetches on a dashboard hard open', () => {
    expect(shouldPrefetchDashboardOnBoot('/dashboard')).toBe(true);
    expect(shouldPrefetchDashboardOnBoot('/dashboard/pools', { hasSession: false })).toBe(
      true,
    );
  });

  it('prefetches on cold-open surfaces only with a session hint (#804)', () => {
    expect(shouldPrefetchDashboardOnBoot('/', { hasSession: true })).toBe(true);
    expect(shouldPrefetchDashboardOnBoot('/join/ABC', { hasSession: true })).toBe(true);
    expect(shouldPrefetchDashboardOnBoot('/setup', { hasSession: true })).toBe(true);
    expect(shouldPrefetchDashboardOnBoot('/')).toBe(false);
    expect(shouldPrefetchDashboardOnBoot('/join/ABC', { hasSession: false })).toBe(false);
  });

  it('leaves marketing and unknown paths alone', () => {
    expect(shouldPrefetchDashboardOnBoot('/how-it-works', { hasSession: true })).toBe(
      false,
    );
    expect(shouldPrefetchDashboardOnBoot('', { hasSession: true })).toBe(false);
    expect(shouldPrefetchDashboardOnBoot(undefined)).toBe(false);
  });
});
