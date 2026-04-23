import { describe, expect, it } from 'vitest';

import { filterPicksToAudience } from './useDisplayedPicks';

const baseUserPools = [
  {
    id: 'pool-a',
    name: 'Alpha',
    members: ['u-alice', 'u-bob'],
  },
  {
    id: 'pool-b',
    name: 'Bravo',
    members: ['u-carol'],
  },
];

/**
 * Pick row with `pools: [{ id }]` snapshot set — the modern shape
 * that `pickDataCountsForPool` prefers. Picks without `pools` fall
 * back to "counts everywhere the user is a member".
 */
const pickSnapshotIn = (userId, poolIds) => ({
  userId,
  pools: poolIds.map((id) => ({ id })),
  picks: { s1: 'Tweezer' },
});

const pickLegacy = (userId) => ({
  userId,
  picks: { s1: 'Tweezer' },
});

describe('filterPicksToAudience', () => {
  it('returns the input verbatim for global', () => {
    const picks = [pickLegacy('u-alice'), pickLegacy('u-carol')];
    expect(
      filterPicksToAudience({
        picks,
        userPools: baseUserPools,
        activeFilter: 'global',
      }),
    ).toBe(picks);
  });

  it('treats falsy activeFilter as global', () => {
    const picks = [pickLegacy('u-alice')];
    expect(
      filterPicksToAudience({
        picks,
        userPools: baseUserPools,
        activeFilter: '',
      }),
    ).toBe(picks);
    expect(
      filterPicksToAudience({
        picks,
        userPools: baseUserPools,
        activeFilter: undefined,
      }),
    ).toBe(picks);
  });

  it('passes picks through unchanged when the target pool is unknown', () => {
    const picks = [pickLegacy('u-alice')];
    expect(
      filterPicksToAudience({
        picks,
        userPools: baseUserPools,
        activeFilter: 'ghost-pool',
      }),
    ).toBe(picks);
  });

  it('filters to pool members only (legacy shape)', () => {
    const picks = [
      pickLegacy('u-alice'),
      pickLegacy('u-bob'),
      pickLegacy('u-carol'),
      pickLegacy('u-dan'),
    ];
    const result = filterPicksToAudience({
      picks,
      userPools: baseUserPools,
      activeFilter: 'pool-a',
    });
    expect(result.map((p) => p.userId)).toEqual(['u-alice', 'u-bob']);
  });

  it('honours the pick snapshot when present (member in pool, pick not in snapshot → excluded)', () => {
    const picks = [
      pickSnapshotIn('u-alice', ['pool-a']),
      pickSnapshotIn('u-bob', ['pool-b']),
      pickSnapshotIn('u-carol', ['pool-a', 'pool-b']),
    ];
    const result = filterPicksToAudience({
      picks,
      userPools: baseUserPools,
      activeFilter: 'pool-a',
    });
    expect(result.map((p) => p.userId)).toEqual(['u-alice']);
  });

  it('handles null userPools', () => {
    const picks = [pickLegacy('u-alice')];
    expect(
      filterPicksToAudience({ picks, userPools: null, activeFilter: 'pool-a' }),
    ).toBe(picks);
  });
});
