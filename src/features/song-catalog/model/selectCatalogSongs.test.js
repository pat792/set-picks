import { describe, it, expect } from 'vitest';
import {
  normalizeCatalogLastDate,
  selectCatalogSongs,
} from './selectCatalogSongs.js';

const fallback = [{ name: 'Static Song' }];

describe('selectCatalogSongs', () => {
  it('uses remote when non-empty array', () => {
    const remote = [{ name: 'Live Song', last: '2026-07-27' }];
    expect(selectCatalogSongs(remote, fallback)).toEqual({
      songs: remote,
      source: 'cdn',
    });
  });

  it('maps last_played onto last and strips timestamps', () => {
    const { songs } = selectCatalogSongs(
      [{ name: 'Wilson', last_played: '2026-07-27T00:00:00.000Z' }],
      fallback,
    );
    expect(songs[0].last).toBe('2026-07-27');
  });

  it('falls back when remote missing or empty', () => {
    expect(selectCatalogSongs(null, fallback).source).toBe('fallback');
    expect(selectCatalogSongs([], fallback).songs).toEqual(fallback);
  });
});

describe('normalizeCatalogLastDate', () => {
  it('keeps YYYY-MM-DD and treats em-dash as empty', () => {
    expect(normalizeCatalogLastDate('2026-07-27')).toBe('2026-07-27');
    expect(normalizeCatalogLastDate('—')).toBeUndefined();
    expect(normalizeCatalogLastDate('')).toBeUndefined();
  });
});
