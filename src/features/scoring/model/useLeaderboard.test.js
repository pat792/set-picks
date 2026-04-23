import { describe, it, expect } from 'vitest';

import { pinSelfToTop } from './useLeaderboard';

describe('pinSelfToTop', () => {
  it('returns rows unchanged when selfUserId is falsy', () => {
    const rows = [{ userId: 'a' }, { userId: 'b' }];
    expect(pinSelfToTop(rows, null)).toBe(rows);
    expect(pinSelfToTop(rows, undefined)).toBe(rows);
    expect(pinSelfToTop(rows, '')).toBe(rows);
  });

  it('returns rows unchanged when the row set is empty or malformed', () => {
    expect(pinSelfToTop([], 'me')).toEqual([]);
    expect(pinSelfToTop(null, 'me')).toBeNull();
    expect(pinSelfToTop(undefined, 'me')).toBeUndefined();
  });

  it('returns the same array reference when self is not present', () => {
    const rows = [{ userId: 'a' }, { userId: 'b' }];
    expect(pinSelfToTop(rows, 'me')).toBe(rows);
  });

  it('returns the same array reference when self is already rank 1', () => {
    const rows = [{ userId: 'me' }, { userId: 'a' }, { userId: 'b' }];
    expect(pinSelfToTop(rows, 'me')).toBe(rows);
  });

  it('moves self to index 0 and preserves the relative order of the rest', () => {
    const rows = [
      { userId: 'a' },
      { userId: 'b' },
      { userId: 'me' },
      { userId: 'c' },
    ];
    const result = pinSelfToTop(rows, 'me');
    expect(result).not.toBe(rows);
    expect(result.map((r) => r.userId)).toEqual(['me', 'a', 'b', 'c']);
  });

  it('matches on either `userId` or legacy `uid`', () => {
    const rows = [
      { uid: 'a' },
      { uid: 'b' },
      { uid: 'me' },
    ];
    expect(pinSelfToTop(rows, 'me').map((r) => r.uid)).toEqual(['me', 'a', 'b']);

    const rows2 = [{ userId: 'a' }, { uid: 'me' }, { userId: 'b' }];
    expect(pinSelfToTop(rows2, 'me').map((r) => r.userId || r.uid)).toEqual([
      'me',
      'a',
      'b',
    ]);
  });
});
