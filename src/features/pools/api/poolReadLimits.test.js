import { describe, expect, it } from 'vitest';

import { MAX_POOL_MEMBERS_FETCH, MAX_USER_POOLS_FETCH } from './poolReadLimits';

describe('pool read limits (#415)', () => {
  it('caps member profile loads at a documented maximum', () => {
    expect(MAX_POOL_MEMBERS_FETCH).toBe(100);
  });

  it('caps per-user pool membership lists', () => {
    expect(MAX_USER_POOLS_FETCH).toBe(50);
  });
});
