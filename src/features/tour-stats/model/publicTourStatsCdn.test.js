import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PUBLIC_TOUR_STATS_CDN_PREFIX,
  publicTourStatsCdnUrl,
  readCachedPublicTourStatsDoc,
  readCachedPublicTourStatsIndex,
  writeCachedPublicTourStatsDoc,
  writeCachedPublicTourStatsIndex,
} from './publicTourStatsCdn';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

beforeEach(() => {
  vi.stubGlobal('sessionStorage', createMemoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('publicTourStatsCdnUrl', () => {
  it('maps _index and slugs under /tour-stats-data', () => {
    expect(publicTourStatsCdnUrl()).toBe(`${PUBLIC_TOUR_STATS_CDN_PREFIX}/_index.json`);
    expect(publicTourStatsCdnUrl('_index')).toBe(
      `${PUBLIC_TOUR_STATS_CDN_PREFIX}/_index.json`,
    );
    expect(publicTourStatsCdnUrl('2026-summer-tour')).toBe(
      `${PUBLIC_TOUR_STATS_CDN_PREFIX}/2026-summer-tour.json`,
    );
  });
});

describe('public tour-stats session cache', () => {
  it('round-trips index + doc and ignores _index slugs', () => {
    expect(readCachedPublicTourStatsIndex()).toBeNull();
    writeCachedPublicTourStatsIndex({
      tours: [{ tourSlug: '2026-summer-tour' }],
      defaultTourSlug: '2026-summer-tour',
    });
    expect(readCachedPublicTourStatsIndex()?.defaultTourSlug).toBe(
      '2026-summer-tour',
    );

    writeCachedPublicTourStatsDoc('2026-summer-tour', {
      tourLabel: '2026 Summer Tour',
      uniqueSongs: 10,
    });
    expect(readCachedPublicTourStatsDoc('2026-summer-tour')?.uniqueSongs).toBe(10);
    expect(readCachedPublicTourStatsDoc('_index')).toBeNull();
  });

  it('survives sessionStorage throwing (Safari Private)', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(readCachedPublicTourStatsIndex()).toBeNull();
    expect(() =>
      writeCachedPublicTourStatsIndex({ tours: [], defaultTourSlug: '' }),
    ).not.toThrow();
  });
});
