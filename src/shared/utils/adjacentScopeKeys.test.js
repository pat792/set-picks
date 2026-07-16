import { describe, expect, it } from 'vitest';

import { adjacentScopeKeys } from './adjacentScopeKeys';

describe('adjacentScopeKeys', () => {
  const shows = [{ date: 'a' }, { date: 'b' }, { date: 'c' }];
  const getKey = (s) => s.date;

  it('returns neighbors for a middle key', () => {
    expect(adjacentScopeKeys(shows, 'b', getKey)).toEqual({
      index: 1,
      prevKey: 'a',
      nextKey: 'c',
    });
  });

  it('disables prev at the start', () => {
    expect(adjacentScopeKeys(shows, 'a', getKey)).toEqual({
      index: 0,
      prevKey: null,
      nextKey: 'b',
    });
  });

  it('disables next at the end', () => {
    expect(adjacentScopeKeys(shows, 'c', getKey)).toEqual({
      index: 2,
      prevKey: 'b',
      nextKey: null,
    });
  });

  it('handles missing key / empty list', () => {
    expect(adjacentScopeKeys(shows, 'z', getKey)).toEqual({
      index: -1,
      prevKey: null,
      nextKey: null,
    });
    expect(adjacentScopeKeys([], 'a', getKey)).toEqual({
      index: -1,
      prevKey: null,
      nextKey: null,
    });
  });
});
