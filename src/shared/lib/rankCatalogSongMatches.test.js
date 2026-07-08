import { describe, expect, it } from 'vitest';

import {
  compareCatalogSongsByGapAndPlays,
  rankCatalogSongMatches,
} from './rankCatalogSongMatches.js';

describe('compareCatalogSongsByGapAndPlays', () => {
  it('ranks lower gap first', () => {
    expect(
      compareCatalogSongsByGapAndPlays(
        { name: 'A', gap: '1', total: '10' },
        { name: 'B', gap: '5', total: '10' },
      ),
    ).toBeLessThan(0);
  });

  it('breaks gap ties by higher total', () => {
    expect(
      compareCatalogSongsByGapAndPlays(
        { name: 'A', gap: '2', total: '200' },
        { name: 'B', gap: '2', total: '50' },
      ),
    ).toBeLessThan(0);
  });

  it('sorts missing gap/total after numeric values', () => {
    expect(
      compareCatalogSongsByGapAndPlays(
        { name: 'A', gap: '—', total: '—' },
        { name: 'B', gap: '3', total: '10' },
      ),
    ).toBeGreaterThan(0);
  });
});

describe('rankCatalogSongMatches', () => {
  const songs = [
    { name: 'The Silver Light', total: '1', gap: '203' },
    { name: 'Slave to the Traffic Light', total: '296', gap: '0' },
    { name: 'Shine a Light', total: '30', gap: '15' },
    { name: 'Midnight Moonlight', total: '1', gap: '1255' },
    { name: 'Midnight Moonlight', total: '1', gap: '400' },
    { name: 'Light Up Or Leave Me Alone', total: '19', gap: '561' },
    { name: 'Light', total: '135', gap: '8' },
  ];

  it('surfaces lowest-gap, highest-played matches first for "light"', () => {
    const matches = rankCatalogSongMatches(songs, 'light');
    expect(matches.map((s) => s.name)).toEqual([
      'Slave to the Traffic Light',
      'Light',
      'Shine a Light',
      'The Silver Light',
      'Midnight Moonlight',
      'Light Up Or Leave Me Alone',
    ]);
  });

  it('dedupes catalog rows by title keeping the best-ranked row', () => {
    const matches = rankCatalogSongMatches(songs, 'moonlight');
    expect(matches).toHaveLength(1);
    expect(matches[0].gap).toBe('400');
  });

  it('respects excluded titles', () => {
    const matches = rankCatalogSongMatches(songs, 'light', {
      excludeTitlesLower: new Set(['light']),
    });
    expect(matches.some((s) => s.name === 'Light')).toBe(false);
  });

  it('honors limit', () => {
    const matches = rankCatalogSongMatches(songs, 'light', { limit: 3 });
    expect(matches).toHaveLength(3);
  });
});
