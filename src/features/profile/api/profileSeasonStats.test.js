import { describe, expect, it } from 'vitest';

import {
  deriveLatestFinalizedShow,
  readMaterializedSeasonStats,
  withCareerCorrectSlots,
} from './profileSeasonStats';

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

  it('includes careerCorrectSlots when present on the user doc', () => {
    expect(
      readMaterializedSeasonStats(
        { ...FRESH, careerCorrectSlots: 18 },
        '2026-04-23'
      )
    ).toEqual({
      totalPoints: 42,
      shows: 5,
      wins: 2,
      careerCorrectSlots: 18,
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

/**
 * #635 Slice 0: live fallback must keep rollup/backfill careerCorrectSlots
 * so avg correct still renders when freshness short-circuit fails.
 */
describe('withCareerCorrectSlots', () => {
  const BASE = { totalPoints: 42, shows: 5, wins: 2 };

  it('attaches a finite careerCorrectSlots from the user doc', () => {
    expect(
      withCareerCorrectSlots(BASE, { careerCorrectSlots: 18 })
    ).toEqual({ ...BASE, careerCorrectSlots: 18 });
  });

  it('preserves zero careerCorrectSlots', () => {
    expect(
      withCareerCorrectSlots(BASE, { careerCorrectSlots: 0 })
    ).toEqual({ ...BASE, careerCorrectSlots: 0 });
  });

  it('leaves stats unchanged when careerCorrectSlots is missing or invalid', () => {
    expect(withCareerCorrectSlots(BASE, null)).toEqual(BASE);
    expect(withCareerCorrectSlots(BASE, {})).toEqual(BASE);
    expect(
      withCareerCorrectSlots(BASE, { careerCorrectSlots: '18' })
    ).toEqual(BASE);
    expect(
      withCareerCorrectSlots(BASE, { careerCorrectSlots: Number.NaN })
    ).toEqual(BASE);
  });

  it('does not mutate the input stats object', () => {
    const input = { ...BASE };
    withCareerCorrectSlots(input, { careerCorrectSlots: 9 });
    expect(input).toEqual(BASE);
  });
});

/**
 * #635 Slice 0: exclude today so an ungraded show-day calendar entry does
 * not falsely stale rollups through yesterday.
 */
describe('deriveLatestFinalizedShow', () => {
  it('returns the max calendar date strictly before today', () => {
    expect(
      deriveLatestFinalizedShow(
        [
          { date: '2026-07-15' },
          { date: '2026-07-16' },
          { date: '2026-07-17' },
        ],
        '2026-07-17'
      )
    ).toBe('2026-07-16');
  });

  it('skips today even when it is the only calendar date', () => {
    expect(
      deriveLatestFinalizedShow([{ date: '2026-07-17' }], '2026-07-17')
    ).toBeNull();
  });

  it('skips future dates and empty/invalid entries', () => {
    expect(
      deriveLatestFinalizedShow(
        [
          { date: '2026-07-14' },
          { date: '' },
          null,
          { date: '2026-07-20' },
          { date: '2026-07-15' },
        ],
        '2026-07-17'
      )
    ).toBe('2026-07-15');
  });

  it('returns null for an empty calendar', () => {
    expect(deriveLatestFinalizedShow([], '2026-07-17')).toBeNull();
    expect(deriveLatestFinalizedShow(null, '2026-07-17')).toBeNull();
  });
});
