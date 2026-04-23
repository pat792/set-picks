import { describe, expect, it } from 'vitest';

import {
  hasNonEmptyPicksObject,
  pickCountsTowardSeason,
  reduceShowWinners,
} from './showAggregation';

describe('hasNonEmptyPicksObject', () => {
  it('rejects non-objects and arrays', () => {
    expect(hasNonEmptyPicksObject(null)).toBe(false);
    expect(hasNonEmptyPicksObject(undefined)).toBe(false);
    expect(hasNonEmptyPicksObject('set1')).toBe(false);
    expect(hasNonEmptyPicksObject(['set1'])).toBe(false);
  });

  it('treats blank / missing values as empty', () => {
    expect(hasNonEmptyPicksObject({})).toBe(false);
    expect(hasNonEmptyPicksObject({ s1: '', s2: null, s3: '   ' })).toBe(false);
  });

  it('is non-empty as soon as any slot has a song', () => {
    expect(hasNonEmptyPicksObject({ s1: '', s2: 'Tweezer' })).toBe(true);
  });
});

describe('pickCountsTowardSeason', () => {
  it('requires isGraded === true', () => {
    expect(
      pickCountsTowardSeason({ isGraded: false, picks: { s1: 'Tweezer' } })
    ).toBe(false);
    expect(
      pickCountsTowardSeason({ picks: { s1: 'Tweezer' } })
    ).toBe(false);
  });

  it('requires at least one non-empty pick', () => {
    expect(
      pickCountsTowardSeason({ isGraded: true, picks: { s1: '' } })
    ).toBe(false);
    expect(
      pickCountsTowardSeason({ isGraded: true, picks: { s1: 'Tweezer' } })
    ).toBe(true);
  });

  it('handles null / undefined inputs', () => {
    expect(pickCountsTowardSeason(null)).toBe(false);
    expect(pickCountsTowardSeason(undefined)).toBe(false);
  });
});

describe('reduceShowWinners', () => {
  const graded = (score, extra = {}) => ({
    isGraded: true,
    picks: { s1: 'Tweezer' },
    score,
    ...extra,
  });

  it('returns null max when nobody is eligible', () => {
    const result = reduceShowWinners([
      { isGraded: false, picks: { s1: 'Tweezer' }, score: 50 },
      { isGraded: true, picks: {}, score: 20 },
    ]);
    expect(result).toEqual({ max: null, winners: [] });
  });

  it('credits nobody when max score is 0', () => {
    const result = reduceShowWinners([graded(0, { uid: 'a' }), graded(0, { uid: 'b' })]);
    expect(result).toEqual({ max: null, winners: [] });
  });

  it('returns a single winner when no tie exists', () => {
    const a = graded(30, { uid: 'a' });
    const b = graded(40, { uid: 'b' });
    const c = graded(20, { uid: 'c' });
    const result = reduceShowWinners([a, b, c]);
    expect(result.max).toBe(40);
    expect(result.winners).toEqual([b]);
  });

  it('returns all tied rows at the top score', () => {
    const a = graded(72, { uid: 'a' });
    const b = graded(30, { uid: 'b' });
    const c = graded(72, { uid: 'c' });
    const result = reduceShowWinners([a, b, c]);
    expect(result.max).toBe(72);
    expect(result.winners).toEqual([a, c]);
  });

  it('treats missing score as 0', () => {
    const a = { isGraded: true, picks: { s1: 'Tweezer' }, uid: 'a' };
    const b = graded(5, { uid: 'b' });
    const result = reduceShowWinners([a, b]);
    expect(result.max).toBe(5);
    expect(result.winners.map((r) => r.uid)).toEqual(['b']);
  });
});
