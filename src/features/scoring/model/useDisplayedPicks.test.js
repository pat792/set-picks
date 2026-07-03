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

  it('from_membership: excludes legacy empty-pools and pre-join shows', () => {
    const pools = [
      {
        id: 'pool-new',
        members: ['u-alice', 'u-bob'],
        standingsScope: 'from_membership',
        memberJoinedAt: {
          'u-alice': '2026-07-03T18:00:00.000Z',
          'u-bob': '2026-07-05T18:00:00.000Z',
        },
      },
    ];
    const picks = [
      { ...pickLegacy('u-alice'), showDate: '2026-07-10' },
      { ...pickSnapshotIn('u-alice', ['pool-new']), showDate: '2026-07-02' },
      { ...pickSnapshotIn('u-alice', ['pool-new']), showDate: '2026-07-04' },
      { ...pickSnapshotIn('u-bob', ['pool-new']), showDate: '2026-07-04' },
      { ...pickSnapshotIn('u-bob', ['pool-new']), showDate: '2026-07-06' },
    ];
    const result = filterPicksToAudience({
      picks,
      userPools: pools,
      activeFilter: 'pool-new',
    });
    expect(result).toEqual([
      picks[2], // alice on/after join
      picks[4], // bob on/after join
    ]);
  });
});
