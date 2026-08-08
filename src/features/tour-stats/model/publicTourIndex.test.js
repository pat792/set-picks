import { describe, expect, it } from 'vitest';

import {
  resolveDefaultPublicTourSlug,
  sortPublicTourIndex,
} from './publicTourIndex';

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
