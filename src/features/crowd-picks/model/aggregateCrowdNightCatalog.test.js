import { describe, expect, it } from 'vitest';

import { aggregateCrowdNightSongs } from './aggregateCrowdNightSongs';
import {
  aggregateCrowdNightCatalog,
  parseCatalogGap,
  rankCrowdNightByGap,
  computeSlotWeightedVintage,
} from './aggregateCrowdNightCatalog';

describe('parseCatalogGap', () => {
  it('parses numbers and strings; rejects dashes', () => {
    expect(parseCatalogGap(47)).toBe(47);
    expect(parseCatalogGap('12')).toBe(12);
    expect(parseCatalogGap('—')).toBeNull();
    expect(parseCatalogGap('')).toBeNull();
  });
});

describe('aggregateCrowdNightCatalog (#691)', () => {
  const docs = [
    {
      userId: 'a',
      picks: {
        s1o: 'Ghost',
        s1c: 'Tweezer',
        s2o: 'Free',
        s2c: 'Hood',
        enc: 'Zero',
        wild: 'Gin',
      },
    },
    {
      userId: 'b',
      picks: {
        s1o: 'Ghost',
        s1c: 'Sample',
        s2o: 'Free',
        s2c: 'YEM',
        enc: 'Tube',
        wild: 'Gin',
      },
    },
  ];

  const catalog = [
    { name: 'Ghost', gap: '100', debut: '1994-10-31' },
    { name: 'Tweezer', gap: '5', debut: '1990-03-28' },
    { name: 'Free', gap: '20', debut: '1995-01-01' },
    { name: 'Hood', gap: '—', debut: '1985-10-30' },
    { name: 'Gin', gap: '8', debut: '1989-01-01' },
    { name: 'Sample', gap: '3', debut: '1992-01-01' },
    { name: 'YEM', gap: '1', debut: '1983-01-01' },
    { name: 'Zero', gap: '2', debut: '1996-01-01' },
    { name: 'Tube', gap: '4', debut: '1999-01-01' },
  ];

  it('ranks highest gap among picked titles', () => {
    const night = aggregateCrowdNightSongs('2026-07-17', docs);
    const { highestGap } = aggregateCrowdNightCatalog(night, catalog, {
      gapTopN: 3,
    });
    expect(highestGap[0].title).toBe('Ghost');
    expect(highestGap[0].gap).toBe(100);
    expect(highestGap.every((r) => typeof r.gap === 'number')).toBe(true);
  });

  it('computes slot-weighted vintage', () => {
    const night = aggregateCrowdNightSongs('2026-07-17', docs);
    const { vintage } = aggregateCrowdNightCatalog(night, catalog);
    expect(vintage.totalSlots).toBe(12);
    expect(vintage.datedSlots).toBe(12);
    expect(vintage.avgYear).toBeGreaterThan(1980);
    expect(vintage.coveragePct).toBe(100);
  });

  it('rankCrowdNightByGap skips unknown gaps', () => {
    const rows = rankCrowdNightByGap(
      [
        { title: 'Ghost', cardCount: 2 },
        { title: 'Hood', cardCount: 1 },
      ],
      { ghost: 100 }
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Ghost');
  });

  it('computeSlotWeightedVintage weights repeats', () => {
    const v = computeSlotWeightedVintage(
      [
        {
          picks: {
            s1o: 'A',
            s1c: 'A',
            s2o: 'B',
            s2c: 'B',
            enc: 'B',
            wild: 'B',
          },
        },
      ],
      { a: 2000, b: 1990 }
    );
    // 2×2000 + 4×1990 = 11960 / 6 → rounded to 3 decimals
    expect(v.avgYear).toBe(1993.333);
  });
});
