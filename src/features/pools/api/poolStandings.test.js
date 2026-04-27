import { describe, expect, it } from 'vitest';

import { readMaterializedPoolStandings } from './poolStandings';

/**
 * #254 short-circuit predicate for pool standings. Pure so the decision
 * table can be tested directly without mocking Firestore.
 */
describe('readMaterializedPoolStandings (all-time scope)', () => {
  const FRESH = {
    totalPoints: 42,
    showsPlayed: 5,
    wins: 2,
    seasonStatsThroughShow: '2026-04-23',
  };

  it('returns the materialized triple when fields are numeric and snapshot is caught up', () => {
    expect(
      readMaterializedPoolStandings(FRESH, {
        latestFinalizedShow: '2026-04-23',
      })
    ).toEqual({ totalScore: 42, showsPlayed: 5, wins: 2 });
  });

  it('returns the materialized triple when the snapshot is ahead of the latest finalized show', () => {
    expect(
      readMaterializedPoolStandings(
        { ...FRESH, seasonStatsThroughShow: '2026-04-24' },
        { latestFinalizedShow: '2026-04-23' }
      )
    ).toEqual({ totalScore: 42, showsPlayed: 5, wins: 2 });
  });

  it('returns null when the user doc is missing / empty', () => {
    expect(
      readMaterializedPoolStandings(null, { latestFinalizedShow: '2026-04-23' })
    ).toBeNull();
    expect(
      readMaterializedPoolStandings(undefined, {
        latestFinalizedShow: '2026-04-23',
      })
    ).toBeNull();
    expect(
      readMaterializedPoolStandings({}, { latestFinalizedShow: '2026-04-23' })
    ).toBeNull();
  });

  it('returns null when any of the three numeric fields is missing', () => {
    const { wins: _wins, ...noWins } = FRESH;
    const { showsPlayed: _shows, ...noShows } = FRESH;
    const { totalPoints: _pts, ...noPts } = FRESH;
    expect(
      readMaterializedPoolStandings(noWins, {
        latestFinalizedShow: '2026-04-23',
      })
    ).toBeNull();
    expect(
      readMaterializedPoolStandings(noShows, {
        latestFinalizedShow: '2026-04-23',
      })
    ).toBeNull();
    expect(
      readMaterializedPoolStandings(noPts, {
        latestFinalizedShow: '2026-04-23',
      })
    ).toBeNull();
  });

  it('returns null when the snapshot is stale (older than latestFinalizedShow)', () => {
    expect(
      readMaterializedPoolStandings(
        { ...FRESH, seasonStatsThroughShow: '2026-04-22' },
        { latestFinalizedShow: '2026-04-23' }
      )
    ).toBeNull();
  });

  it('returns null when latestFinalizedShow is missing (defensive fallback)', () => {
    expect(
      readMaterializedPoolStandings(FRESH, { latestFinalizedShow: null })
    ).toBeNull();
    expect(
      readMaterializedPoolStandings(FRESH, { latestFinalizedShow: '' })
    ).toBeNull();
    expect(readMaterializedPoolStandings(FRESH, {})).toBeNull();
  });

  it('allows a zero-valued materialized triple (new pool, no graded picks yet)', () => {
    expect(
      readMaterializedPoolStandings(
        {
          totalPoints: 0,
          showsPlayed: 0,
          wins: 0,
          seasonStatsThroughShow: '2026-04-23',
        },
        { latestFinalizedShow: '2026-04-23' }
      )
    ).toEqual({ totalScore: 0, showsPlayed: 0, wins: 0 });
  });
});

describe('readMaterializedPoolStandings (tour scope)', () => {
  const TOUR_KEY = 'Spring 2026 Tour';
  const FRESH = {
    totalPoints: 42,
    showsPlayed: 5,
    wins: 2,
    seasonStats: {
      [TOUR_KEY]: { totalPoints: 18, shows: 2, wins: 1 },
    },
    seasonStatsThroughShow: '2026-04-23',
  };

  it('returns the per-tour aggregates when the snapshot is caught up', () => {
    expect(
      readMaterializedPoolStandings(FRESH, {
        latestFinalizedShow: '2026-04-23',
        tourKey: TOUR_KEY,
      })
    ).toEqual({ totalScore: 18, showsPlayed: 2, wins: 1 });
  });

  it('returns null when the seasonStats map is missing', () => {
    const { seasonStats: _ss, ...noSeasonStats } = FRESH;
    expect(
      readMaterializedPoolStandings(noSeasonStats, {
        latestFinalizedShow: '2026-04-23',
        tourKey: TOUR_KEY,
      })
    ).toBeNull();
  });

  it('returns null when the tour entry is missing', () => {
    expect(
      readMaterializedPoolStandings(FRESH, {
        latestFinalizedShow: '2026-04-23',
        tourKey: 'Some Other Tour',
      })
    ).toBeNull();
  });

  it('returns null when any tour-scoped numeric is non-numeric', () => {
    expect(
      readMaterializedPoolStandings(
        {
          ...FRESH,
          seasonStats: {
            [TOUR_KEY]: { totalPoints: 18, shows: 2, wins: '1' },
          },
        },
        { latestFinalizedShow: '2026-04-23', tourKey: TOUR_KEY }
      )
    ).toBeNull();
  });

  it('returns null when the snapshot is stale even if the tour map is present', () => {
    expect(
      readMaterializedPoolStandings(
        { ...FRESH, seasonStatsThroughShow: '2026-04-22' },
        { latestFinalizedShow: '2026-04-23', tourKey: TOUR_KEY }
      )
    ).toBeNull();
  });

  it('falls back to all-time top-level fields when tourKey is null', () => {
    expect(
      readMaterializedPoolStandings(FRESH, {
        latestFinalizedShow: '2026-04-23',
        tourKey: null,
      })
    ).toEqual({ totalScore: 42, showsPlayed: 5, wins: 2 });
  });
});
