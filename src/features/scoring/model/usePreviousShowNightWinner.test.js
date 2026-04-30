import { describe, expect, it } from 'vitest';

import { filterPicksToAudience } from './useDisplayedPicks';
import { computeShowWinnerOfTheNight } from './useShowWinnerOfTheNight';

const userPools = [
  { id: 'pool-a', name: 'Alpha', members: ['u-a', 'u-b'] },
  { id: 'pool-b', name: 'Bravo', members: ['u-c'] },
];

const graded = (userId, score, poolIds) => ({
  userId,
  isGraded: true,
  score,
  picks: { s1: 'Tweezer' },
  pools: poolIds.map((id) => ({ id })),
  handle: userId,
});

describe('previous show night winner (pool scope, pure)', () => {
  it('uses pool-high score, not global-high', () => {
    const raw = [
      graded('u-a', 12, ['pool-a']),
      graded('u-b', 11, ['pool-a']),
      graded('u-c', 99, ['pool-b']),
    ];
    const scoped = filterPicksToAudience({
      picks: raw,
      userPools,
      activeFilter: 'pool-a',
    });
    const result = computeShowWinnerOfTheNight(scoped);
    expect(result.max).toBe(12);
    expect(result.winners.map((w) => w.userId)).toEqual(['u-a']);
    expect(result.eligiblePlayers).toBe(2);
    expect(result.beats).toBe(1);
  });
});
