import { describe, expect, it } from 'vitest';

import { aggregatePoolStandings, EMPTY_POOL_STANDINGS_ROW } from './poolStandings';

/**
 * Pure aggregation step for pool standings. The wins column follows the
 * **global** "winner of the night" rule (`pick.score === globalMax`,
 * `globalMax > 0`, ties share) so a user sees a consistent wins count
 * across pool standings, Standings #218, Profile #217, and Tour
 * standings #219. Points and shows stay pool-scoped (caller filters
 * picks via `pickDataCountsForPool`).
 */
describe('aggregatePoolStandings', () => {
  it('sums points and counts shows per member', () => {
    const totals = aggregatePoolStandings(
      ['u1', 'u2'],
      [
        { showDate: '2026-04-16', userId: 'u1', score: 10 },
        { showDate: '2026-04-17', userId: 'u1', score: 8 },
        { showDate: '2026-04-16', userId: 'u2', score: 5 },
      ],
      // No global-max map → no wins credited; isolates the points/shows assertion.
      undefined
    );
    expect(totals.get('u1')).toEqual({ totalScore: 18, showsPlayed: 2, wins: 0 });
    expect(totals.get('u2')).toEqual({ totalScore: 5, showsPlayed: 1, wins: 0 });
  });

  it('credits wins using the GLOBAL max, not the pool-internal max', () => {
    // The pool-internal max on 2026-04-16 is u1 at 6, but the global max
    // (e.g. a non-pool-member) is 9, so nobody in the pool wins. On
    // 2026-04-17 u2's 8 matches the global max of 8 and gets the win.
    const totals = aggregatePoolStandings(
      ['u1', 'u2'],
      [
        { showDate: '2026-04-16', userId: 'u1', score: 6 },
        { showDate: '2026-04-16', userId: 'u2', score: 4 },
        { showDate: '2026-04-17', userId: 'u2', score: 8 },
      ],
      new Map([
        ['2026-04-16', 9],
        ['2026-04-17', 8],
      ])
    );
    expect(totals.get('u1')?.wins).toBe(0);
    expect(totals.get('u2')?.wins).toBe(1);
  });

  it('shares wins across ties at the global max', () => {
    const totals = aggregatePoolStandings(
      ['u1', 'u2', 'u3'],
      [
        { showDate: '2026-04-16', userId: 'u1', score: 8 },
        { showDate: '2026-04-16', userId: 'u2', score: 8 },
        { showDate: '2026-04-16', userId: 'u3', score: 4 },
      ],
      new Map([['2026-04-16', 8]])
    );
    expect(totals.get('u1')?.wins).toBe(1);
    expect(totals.get('u2')?.wins).toBe(1);
    expect(totals.get('u3')?.wins).toBe(0);
  });

  it('credits nobody on a hollow night (max === 0 or null)', () => {
    const totals = aggregatePoolStandings(
      ['u1', 'u2'],
      [
        { showDate: '2026-04-16', userId: 'u1', score: 0 },
        { showDate: '2026-04-16', userId: 'u2', score: 0 },
        { showDate: '2026-04-17', userId: 'u1', score: 0 },
      ],
      new Map([
        ['2026-04-16', 0],
        ['2026-04-17', null],
      ])
    );
    expect(totals.get('u1')).toEqual({ totalScore: 0, showsPlayed: 2, wins: 0 });
    expect(totals.get('u2')).toEqual({ totalScore: 0, showsPlayed: 1, wins: 0 });
  });

  it('ignores picks from non-pool members (allowlist boundary)', () => {
    const totals = aggregatePoolStandings(
      ['u1'],
      [
        { showDate: '2026-04-16', userId: 'u1', score: 5 },
        { showDate: '2026-04-16', userId: 'rando', score: 99 },
      ],
      new Map([['2026-04-16', 5]])
    );
    expect(totals.get('u1')).toEqual({ totalScore: 5, showsPlayed: 1, wins: 1 });
    expect(totals.get('rando')).toBeUndefined();
  });

  it('returns EMPTY rows for members with zero qualifying picks', () => {
    const totals = aggregatePoolStandings(
      ['u1', 'u2'],
      [{ showDate: '2026-04-16', userId: 'u1', score: 4 }],
      new Map([['2026-04-16', 4]])
    );
    expect(totals.get('u2')).toEqual(EMPTY_POOL_STANDINGS_ROW);
  });

  it('handles missing / non-array inputs without throwing', () => {
    expect(aggregatePoolStandings(null, null).size).toBe(0);
    expect(aggregatePoolStandings(['u1'], null).get('u1')).toEqual(
      EMPTY_POOL_STANDINGS_ROW
    );
    const empty = aggregatePoolStandings(
      [],
      [{ showDate: '2026-04-16', userId: 'u1', score: 1 }]
    );
    expect(empty.size).toBe(0);
  });

  it('skips invalid pick entries (missing fields, wrong types)', () => {
    const totals = aggregatePoolStandings(
      ['u1'],
      [
        null,
        { userId: 'u1', score: 'not-a-number' },
        { showDate: '2026-04-16', userId: 'u1', score: 7 },
      ],
      new Map([['2026-04-16', 7]])
    );
    expect(totals.get('u1')).toEqual({ totalScore: 7, showsPlayed: 1, wins: 1 });
  });

  it('does not credit wins when globalMaxByShow is omitted', () => {
    const totals = aggregatePoolStandings(['u1'], [
      { showDate: '2026-04-16', userId: 'u1', score: 9 },
    ]);
    expect(totals.get('u1')).toEqual({ totalScore: 9, showsPlayed: 1, wins: 0 });
  });
});
