import { describe, expect, it } from 'vitest';

import { computeShowWinnerOfTheNight } from './useShowWinnerOfTheNight';

const graded = (score, extra = {}) => ({
  isGraded: true,
  picks: { s1: 'Tweezer' },
  score,
  ...extra,
});

describe('computeShowWinnerOfTheNight', () => {
  it('returns the zero-winner shape when nobody is eligible', () => {
    const result = computeShowWinnerOfTheNight([
      { isGraded: false, picks: { s1: 'Tweezer' }, score: 50, uid: 'a' },
      { isGraded: true, picks: {}, score: 20, uid: 'b' },
    ]);
    expect(result).toEqual({
      max: null,
      winners: [],
      eligiblePlayers: 0,
      beats: 0,
      hasUngradedNonEmptyPick: true,
    });
  });

  it('credits nobody when max is 0', () => {
    const result = computeShowWinnerOfTheNight([
      graded(0, { uid: 'a' }),
      graded(0, { uid: 'b' }),
    ]);
    expect(result.max).toBe(null);
    expect(result.winners).toEqual([]);
    expect(result.eligiblePlayers).toBe(2);
    expect(result.beats).toBe(2);
    expect(result.hasUngradedNonEmptyPick).toBe(false);
  });

  it('identifies a lone winner and computes beats', () => {
    const a = graded(30, { uid: 'a' });
    const b = graded(72, { uid: 'b' });
    const c = graded(25, { uid: 'c' });
    const result = computeShowWinnerOfTheNight([a, b, c]);
    expect(result.max).toBe(72);
    expect(result.winners).toEqual([b]);
    expect(result.eligiblePlayers).toBe(3);
    expect(result.beats).toBe(2);
    expect(result.hasUngradedNonEmptyPick).toBe(false);
  });

  it('lists every tied winner and reports beats relative to the tie size', () => {
    const rows = [
      graded(72, { uid: 'a' }),
      graded(50, { uid: 'b' }),
      graded(72, { uid: 'c' }),
      graded(30, { uid: 'd' }),
    ];
    const result = computeShowWinnerOfTheNight(rows);
    expect(result.max).toBe(72);
    expect(result.winners.map((r) => r.uid)).toEqual(['a', 'c']);
    expect(result.eligiblePlayers).toBe(4);
    expect(result.beats).toBe(2);
    expect(result.hasUngradedNonEmptyPick).toBe(false);
  });

  it('flags partial-grade state when graded picks coexist with ungraded non-empty picks', () => {
    // Real-world trigger: admin hit "Finalize and rollup" before the show.
    // Those 5 picks flipped to isGraded: true; new picks landed afterwards
    // with isGraded: false. The banner must NOT crown a winner from the
    // stale graded subset while the live leaderboard ranks someone else.
    const rows = [
      graded(40, { uid: 'a' }),
      graded(30, { uid: 'b' }),
      { isGraded: false, picks: { s1: 'Tweezer' }, score: 80, uid: 'c' },
    ];
    const result = computeShowWinnerOfTheNight(rows);
    expect(result.hasUngradedNonEmptyPick).toBe(true);
    expect(result.winners.map((r) => r.uid)).toEqual(['a']);
  });

  it('ignores ungraded picks that have no songs entered', () => {
    const rows = [
      graded(40, { uid: 'a' }),
      { isGraded: false, picks: {}, score: 0, uid: 'empty' },
      { isGraded: false, picks: { s1: '   ', s2: '' }, score: 0, uid: 'blank' },
    ];
    const result = computeShowWinnerOfTheNight(rows);
    expect(result.hasUngradedNonEmptyPick).toBe(false);
    expect(result.winners.map((r) => r.uid)).toEqual(['a']);
  });

  it('tolerates missing / null input', () => {
    expect(computeShowWinnerOfTheNight(null)).toEqual({
      max: null,
      winners: [],
      eligiblePlayers: 0,
      beats: 0,
      hasUngradedNonEmptyPick: false,
    });
    expect(computeShowWinnerOfTheNight(undefined)).toEqual({
      max: null,
      winners: [],
      eligiblePlayers: 0,
      beats: 0,
      hasUngradedNonEmptyPick: false,
    });
  });
});
