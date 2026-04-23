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
  });

  it('tolerates missing / null input', () => {
    expect(computeShowWinnerOfTheNight(null)).toEqual({
      max: null,
      winners: [],
      eligiblePlayers: 0,
      beats: 0,
    });
    expect(computeShowWinnerOfTheNight(undefined)).toEqual({
      max: null,
      winners: [],
      eligiblePlayers: 0,
      beats: 0,
    });
  });
});
