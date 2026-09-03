import { describe, expect, it } from 'vitest';

import {
  PICKS_CLUSTER_PATHS,
  isMakePicksPath,
  isPicksClusterPath,
  isProfileClusterPath,
} from './dashboardRoutes';

describe('isPicksClusterPath', () => {
  it('treats /dashboard and /dashboard/picks as the cluster', () => {
    expect(isPicksClusterPath('/dashboard')).toBe(true);
    expect(isPicksClusterPath('/dashboard/')).toBe(true);
    expect(isPicksClusterPath('/dashboard/picks')).toBe(true);
    expect(isPicksClusterPath('/dashboard/picks/')).toBe(true);
  });

  it('includes Lab and Scorecard nested routes', () => {
    expect(isPicksClusterPath(PICKS_CLUSTER_PATHS.lab)).toBe(true);
    expect(isPicksClusterPath(`${PICKS_CLUSTER_PATHS.lab}/`)).toBe(true);
    expect(isPicksClusterPath(PICKS_CLUSTER_PATHS.scorecard)).toBe(true);
  });

  it('does not match sibling primary tabs', () => {
    expect(isPicksClusterPath('/dashboard/pools')).toBe(false);
    expect(isPicksClusterPath('/dashboard/standings')).toBe(false);
    expect(isPicksClusterPath('/dashboard/profile')).toBe(false);
    expect(isPicksClusterPath('/dashboard/tour-stats')).toBe(false);
  });
});

describe('isMakePicksPath', () => {
  it('is true only for the Make Picks form destinations', () => {
    expect(isMakePicksPath('/dashboard')).toBe(true);
    expect(isMakePicksPath('/dashboard/picks')).toBe(true);
    expect(isMakePicksPath(PICKS_CLUSTER_PATHS.lab)).toBe(false);
    expect(isMakePicksPath(PICKS_CLUSTER_PATHS.scorecard)).toBe(false);
  });
});

describe('isProfileClusterPath (unchanged)', () => {
  it('still recognizes profile cluster paths', () => {
    expect(isProfileClusterPath('/dashboard/profile')).toBe(true);
    expect(isProfileClusterPath('/dashboard/picks')).toBe(false);
  });
});
