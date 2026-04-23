import { describe, expect, it } from 'vitest';

import { aggregateTourStandings } from './aggregateTourStandings';

const graded = (overrides) => ({
  isGraded: true,
  picks: { s1: 'Tweezer' },
  ...overrides,
});

describe('aggregateTourStandings', () => {
  it('returns an empty array for missing / empty input', () => {
    expect(aggregateTourStandings(null)).toEqual([]);
    expect(aggregateTourStandings([])).toEqual([]);
  });

  it('sums points and shows across tour shows, credits wins on global max', () => {
    const input = [
      {
        date: '2025-07-15',
        picks: [
          graded({ userId: 'alice', handle: 'alice', score: 60 }),
          graded({ userId: 'bob', handle: 'bob', score: 40 }),
        ],
      },
      {
        date: '2025-07-16',
        picks: [
          graded({ userId: 'alice', handle: 'alice', score: 30 }),
          graded({ userId: 'bob', handle: 'bob', score: 70 }),
          graded({ userId: 'carol', handle: 'carol', score: 70 }),
        ],
      },
    ];
    const rows = aggregateTourStandings(input);
    const byUid = Object.fromEntries(rows.map((r) => [r.uid, r]));
    expect(byUid.alice).toMatchObject({
      totalPoints: 90,
      wins: 1, // won show 1
      shows: 2,
      handle: 'alice',
    });
    expect(byUid.bob).toMatchObject({
      totalPoints: 110,
      wins: 1, // tied show 2
      shows: 2,
    });
    expect(byUid.carol).toMatchObject({
      totalPoints: 70,
      wins: 1, // tied show 2
      shows: 1,
    });
  });

  it('ignores ungraded / empty picks', () => {
    const input = [
      {
        date: '2025-03-01',
        picks: [
          { isGraded: false, userId: 'alice', score: 999, picks: { s1: 'x' } },
          graded({ userId: 'bob', handle: 'bob', score: 20, picks: {} }), // empty
          graded({ userId: 'carol', handle: 'carol', score: 10 }),
        ],
      },
    ];
    const rows = aggregateTourStandings(input);
    expect(rows.map((r) => r.uid)).toEqual(['carol']);
    expect(rows[0]).toMatchObject({ totalPoints: 10, shows: 1, wins: 1 });
  });

  it('skips wins entirely when global max is 0 on a show', () => {
    const input = [
      {
        date: '2025-03-01',
        picks: [
          graded({ userId: 'a', handle: 'a', score: 0 }),
          graded({ userId: 'b', handle: 'b', score: 0 }),
        ],
      },
    ];
    const rows = aggregateTourStandings(input);
    expect(rows.every((r) => r.wins === 0)).toBe(true);
    expect(rows.every((r) => r.shows === 1)).toBe(true);
  });

  it('sorts by points desc, then wins desc, then handle asc', () => {
    const input = [
      {
        date: '2025-03-01',
        picks: [
          graded({ userId: 'a', handle: 'Zed', score: 100 }),
          graded({ userId: 'b', handle: 'Alex', score: 100 }),
          graded({ userId: 'c', handle: 'Bean', score: 80 }),
        ],
      },
    ];
    const rows = aggregateTourStandings(input);
    expect(rows.map((r) => r.handle)).toEqual(['Alex', 'Zed', 'Bean']);
  });
});
