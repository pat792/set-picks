import { describe, expect, it } from 'vitest';

import { POOLS_CLUSTER_PATHS } from '../config/dashboardRoutes';
import { resolvePendingPoolJoinLandingPath } from './pendingPoolJoinLanding';

describe('resolvePendingPoolJoinLandingPath (#768)', () => {
  it('sends a pending /join/:code invite to Join Pool', () => {
    expect(
      resolvePendingPoolJoinLandingPath({ hasPendingInviteCode: true }),
    ).toBe(POOLS_CLUSTER_PATHS.join);
    expect(POOLS_CLUSTER_PATHS.join).toBe('/dashboard/pools/join');
  });

  it('keeps My Pools when no pending invite code exists', () => {
    expect(resolvePendingPoolJoinLandingPath({ hasPendingInviteCode: false })).toBe(
      POOLS_CLUSTER_PATHS.list,
    );
    expect(resolvePendingPoolJoinLandingPath({})).toBe(POOLS_CLUSTER_PATHS.list);
    expect(resolvePendingPoolJoinLandingPath()).toBe(POOLS_CLUSTER_PATHS.list);
  });

  it('treats empty / whitespace codes as no pending invite', () => {
    expect(
      resolvePendingPoolJoinLandingPath({ hasPendingInviteCode: Boolean('  '.trim()) }),
    ).toBe(POOLS_CLUSTER_PATHS.list);
  });
});
