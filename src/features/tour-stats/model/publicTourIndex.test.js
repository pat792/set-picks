import { describe, expect, it } from 'vitest';

import {
  publicTourStatsPathForSlug,
  resolveDefaultPublicTourSlug,
  sortPublicTourIndex,
} from './publicTourIndex';

describe('publicTourStatsPathForSlug', () => {
  it('uses slug paths for every tour including the current default (#929)', () => {
    expect(publicTourStatsPathForSlug('2026-summer-tour')).toBe(
      '/tour-stats/2026-summer-tour',
    );
    expect(publicTourStatsPathForSlug('2026-sphere')).toBe(
      '/tour-stats/2026-sphere',
    );
    expect(publicTourStatsPathForSlug('')).toBe('/tour-stats');
  });
});

describe('sortPublicTourIndex', () => {
  it('orders by lastShowDate descending', () => {
    const sorted = sortPublicTourIndex([
      { tourSlug: '2026-sphere', tourLabel: '2026 Sphere', lastShowDate: '2026-05-02' },
      {
        tourSlug: '2026-summer-tour',
        tourLabel: '2026 Summer Tour',
        lastShowDate: '2026-08-01',
      },
    ]);
    expect(sorted.map((t) => t.tourSlug)).toEqual([
      '2026-summer-tour',
      '2026-sphere',
    ]);
  });
});

describe('resolveDefaultPublicTourSlug', () => {
  it('picks the most recent tour by lastShowDate over a stale preferred slug', () => {
    const slug = resolveDefaultPublicTourSlug(
      [
        {
          tourSlug: '2026-sphere',
          tourLabel: '2026 Sphere',
          lastShowDate: '2026-05-02',
        },
        {
          tourSlug: '2026-summer-tour',
          tourLabel: '2026 Summer Tour',
          lastShowDate: '2026-08-01',
        },
      ],
      '2026-sphere',
    );
    expect(slug).toBe('2026-summer-tour');
  });

  it('uses preferredSlug when no lastShowDate values exist', () => {
    const slug = resolveDefaultPublicTourSlug(
      [
        { tourSlug: '2026-sphere', tourLabel: '2026 Sphere' },
        { tourSlug: '2026-summer-tour', tourLabel: '2026 Summer Tour' },
      ],
      '2026-sphere',
    );
    expect(slug).toBe('2026-sphere');
  });
});
