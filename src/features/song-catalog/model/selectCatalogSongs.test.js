import { describe, it, expect } from 'vitest';
import { selectCatalogSongs } from './selectCatalogSongs.js';

const fallback = [{ name: 'Static Song' }];

describe('selectCatalogSongs', () => {
  it('uses remote when non-empty array', () => {
    const remote = [{ name: 'Live Song' }];
    expect(selectCatalogSongs(remote, fallback)).toEqual({
      songs: remote,
      source: 'cdn',
    });
  });

  it('falls back when remote missing or empty', () => {
    expect(selectCatalogSongs(null, fallback).source).toBe('fallback');
    expect(selectCatalogSongs([], fallback).songs).toEqual(fallback);
  });
});
