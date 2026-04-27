import { describe, expect, it } from 'vitest';

import { aggregatePoolStandings, EMPTY_POOL_STANDINGS_ROW } from './poolStandings';

/**
 * Pure aggregation step for pool standings. Locks down the rule that
 * regressed in the original #254 attempt: pool-internal wins (per show,
 * max across the pool's eligible picks; ties share; `max === 0`
 * credits no one). Also asserts points / shows accumulation and the
 * pool-membership boundary.
 */
describe('aggregatePoolStandings', () => {
  it('sums points and counts shows per member', () => {
    const totals = aggregatePoolStandings(
      ['u1', 'u2'],
      [
        { showDate: '2026-04-16', userId: 'u1', score: 10 },
        { showDate: '2026-04-17', userId: 'u1', score: 8 },
        { showDate: '2026-04-16', userId: 'u2', score: 5 },
      ]
    );
    expect(totals.get('u1')).toEqual({ totalScore: 18, showsPlayed: 2, wins: 2 });
    expect(totals.get('u2')).toEqual({ totalScore: 5, showsPlayed: 1, wins: 0 });
  });

  it('credits pool-internal wins (max across pool members), not the global max', () => {
    // Even though some non-pool member could have scored higher globally,
    // pool standings credit the highest pool member that night.
    const totals = aggregatePoolStandings(
      ['u1', 'u2'],
      [
        { showDate: '2026-04-16', userId: 'u1', score: 6 },
        { showDate: '2026-04-16', userId: 'u2', score: 4 },
      ]
    );
    expect(totals.get('u1')?.wins).toBe(1);
    expect(totals.get('u2')?.wins).toBe(0);
  });

  it('shares wins across ties at the pool-internal max', () => {
    const totals = aggregatePoolStandings(
      ['u1', 'u2', 'u3'],
      [
        { showDate: '2026-04-16', userId: 'u1', score: 8 },
        { showDate: '2026-04-16', userId: 'u2', score: 8 },
        { showDate: '2026-04-16', userId: 'u3', score: 4 },
      ]
    );
    expect(totals.get('u1')?.wins).toBe(1);
    expect(totals.get('u2')?.wins).toBe(1);
    expect(totals.get('u3')?.wins).toBe(0);
  });

  it('credits nobody on a hollow night (max === 0)', () => {
    const totals = aggregatePoolStandings(
      ['u1', 'u2'],
      [
        { showDate: '2026-04-16', userId: 'u1', score: 0 },
        { showDate: '2026-04-16', userId: 'u2', score: 0 },
      ]
    );
    expect(totals.get('u1')).toEqual({ totalScore: 0, showsPlayed: 1, wins: 0 });
    expect(totals.get('u2')).toEqual({ totalScore: 0, showsPlayed: 1, wins: 0 });
  });

  it('ignores picks from non-pool members', () => {
    const totals = aggregatePoolStandings(
      ['u1'],
      [
        { showDate: '2026-04-16', userId: 'u1', score: 5 },
        { showDate: '2026-04-16', userId: 'rando', score: 99 },
      ]
    );
    expect(totals.get('u1')).toEqual({ totalScore: 5, showsPlayed: 1, wins: 1 });
    expect(totals.get('rando')).toBeUndefined();
  });

  it('returns EMPTY rows for members with zero qualifying picks', () => {
    const totals = aggregatePoolStandings(['u1', 'u2'], [
      { showDate: '2026-04-16', userId: 'u1', score: 4 },
    ]);
    expect(totals.get('u2')).toEqual(EMPTY_POOL_STANDINGS_ROW);
  });

  it('handles missing / non-array inputs without throwing', () => {
    expect(aggregatePoolStandings(null, null).size).toBe(0);
    expect(aggregatePoolStandings(['u1'], null).get('u1')).toEqual(
      EMPTY_POOL_STANDINGS_ROW
    );
    const empty = aggregatePoolStandings([], [
      { showDate: '2026-04-16', userId: 'u1', score: 1 },
    ]);
    expect(empty.size).toBe(0);
  });

  it('skips invalid pick entries (missing fields, wrong types)', () => {
    const totals = aggregatePoolStandings(
      ['u1'],
      [
        null,
        { userId: 'u1', score: 'not-a-number' },
        { showDate: '2026-04-16', userId: 'u1', score: 7 },
      ]
    );
    expect(totals.get('u1')).toEqual({ totalScore: 7, showsPlayed: 1, wins: 1 });
  });
});
