import { describe, expect, it } from 'vitest';

import { readMaterializedSeasonStats } from './profileSeasonStats';

/**
 * #244 short-circuit decision logic. Kept as a pure predicate so the
 * decision table can be tested directly without mocking Firestore.
 */
describe('readMaterializedSeasonStats', () => {
  const FRESH = {
    totalPoints: 42,
    showsPlayed: 5,
    wins: 2,
    seasonStatsThroughShow: '2026-04-23',
  };

  it('returns the materialized triple when fields are numeric and snapshot is caught up', () => {
    expect(readMaterializedSeasonStats(FRESH, '2026-04-23')).toEqual({
      totalPoints: 42,
      shows: 5,
      wins: 2,
    });
  });

  it('returns the materialized triple when the snapshot is ahead of the latest finalized show', () => {
    expect(
      readMaterializedSeasonStats(
        { ...FRESH, seasonStatsThroughShow: '2026-04-24' },
        '2026-04-23'
      )
    ).toEqual({ totalPoints: 42, shows: 5, wins: 2 });
  });

  it('returns null when the user doc is missing / empty', () => {
    expect(readMaterializedSeasonStats(null, '2026-04-23')).toBeNull();
    expect(readMaterializedSeasonStats(undefined, '2026-04-23')).toBeNull();
    expect(readMaterializedSeasonStats({}, '2026-04-23')).toBeNull();
  });

  it('returns null when any of the three numeric fields is missing', () => {
    const { wins: _wins, ...noWins } = FRESH;
    const { showsPlayed: _shows, ...noShows } = FRESH;
    const { totalPoints: _pts, ...noPts } = FRESH;
    expect(readMaterializedSeasonStats(noWins, '2026-04-23')).toBeNull();
    expect(readMaterializedSeasonStats(noShows, '2026-04-23')).toBeNull();
    expect(readMaterializedSeasonStats(noPts, '2026-04-23')).toBeNull();
  });

  it('returns null when any numeric field is non-numeric (e.g. legacy string)', () => {
    expect(
      readMaterializedSeasonStats(
        { ...FRESH, wins: '2' },
        '2026-04-23'
      )
    ).toBeNull();
  });

  it('returns null when the snapshot is stale (older than latestFinalizedShow)', () => {
    expect(
      readMaterializedSeasonStats(
        { ...FRESH, seasonStatsThroughShow: '2026-04-22' },
        '2026-04-23'
      )
    ).toBeNull();
  });

  it('returns null when seasonStatsThroughShow is missing', () => {
    const { seasonStatsThroughShow: _through, ...noThrough } = FRESH;
    expect(readMaterializedSeasonStats(noThrough, '2026-04-23')).toBeNull();
  });

  it('returns null when latestFinalizedShow is missing (caller bug → defensive fallback)', () => {
    expect(readMaterializedSeasonStats(FRESH, null)).toBeNull();
    expect(readMaterializedSeasonStats(FRESH, '')).toBeNull();
  });

  it('allows a zero-valued materialized triple (new user with no wins yet)', () => {
    expect(
      readMaterializedSeasonStats(
        {
          totalPoints: 0,
          showsPlayed: 0,
          wins: 0,
          seasonStatsThroughShow: '2026-04-23',
        },
        '2026-04-23'
      )
    ).toEqual({ totalPoints: 0, shows: 0, wins: 0 });
  });
});
