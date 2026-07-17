import { describe, expect, it } from 'vitest';

import {
  buildDebutYearBySongName,
  computeAvgCorrectPicksPerShow,
  computeAvgPointsPerShow,
  computeAvgSongVintage,
  debutYearFromCatalogDebut,
  formatAvgCorrectPicksPerShow,
  formatAvgPointsPerShow,
  formatAvgSongVintage,
} from './profileAverages';

describe('profileAverages', () => {
  it('computes mean points per show', () => {
    expect(computeAvgPointsPerShow({ totalPoints: 210, shows: 5 })).toBe(42);
    expect(computeAvgPointsPerShow({ totalPoints: 100, shows: 3 })).toBeCloseTo(
      33.333,
      2,
    );
  });

  it('returns null when shows is missing or zero', () => {
    expect(computeAvgPointsPerShow({ totalPoints: 10, shows: 0 })).toBeNull();
    expect(computeAvgPointsPerShow({ totalPoints: 10 })).toBeNull();
  });

  it('formats avg points for display', () => {
    expect(formatAvgPointsPerShow(42)).toBe('42');
    expect(formatAvgPointsPerShow(33.333)).toBe('33.3');
    expect(formatAvgPointsPerShow(null)).toBe('—');
  });

  it('parses debut years from catalog strings', () => {
    expect(debutYearFromCatalogDebut('1990-09-28')).toBe(1990);
    expect(debutYearFromCatalogDebut('1983')).toBe(1983);
    expect(debutYearFromCatalogDebut('')).toBeNull();
    expect(debutYearFromCatalogDebut('—')).toBeNull();
    expect(debutYearFromCatalogDebut(1997)).toBe(1997);
  });

  it('builds a case-insensitive debut year map', () => {
    const map = buildDebutYearBySongName([
      { name: 'Tweezer', debut: '1990-09-28' },
      { name: 'Wilson', debut: '' },
      { name: 'Ghost', debut: '1997-06-13' },
    ]);
    expect(map.get('tweezer')).toBe(1990);
    expect(map.has('wilson')).toBe(false);
    expect(map.get('ghost')).toBe(1997);
  });

  it('averages vintage over unique dated titles only', () => {
    const debuts = buildDebutYearBySongName([
      { name: 'Tweezer', debut: '1990-09-28' },
      { name: 'Ghost', debut: '1997-06-13' },
    ]);
    const result = computeAvgSongVintage(
      ['Tweezer', 'tweezer', 'Ghost', 'Unknown Song'],
      debuts,
    );
    expect(result.uniqueCount).toBe(3);
    expect(result.datedCount).toBe(2);
    expect(result.avgYear).toBeCloseTo((1990 + 1997) / 2, 5);
    expect(formatAvgSongVintage(result.avgYear)).toBe('1994');
  });

  it('returns null avg when no titles are dated', () => {
    expect(computeAvgSongVintage(['Foo'], new Map())).toEqual({
      avgYear: null,
      datedCount: 0,
      uniqueCount: 1,
    });
    expect(formatAvgSongVintage(null)).toBe('—');
  });

  it('computes avg correct slots per show from careerCorrectSlots', () => {
    // 18 correct across 3 shows × 6 slots → 18/18 = 1
    expect(
      computeAvgCorrectPicksPerShow({ careerCorrectSlots: 18, shows: 3 })
    ).toBe(1);
    expect(
      computeAvgCorrectPicksPerShow({ careerCorrectSlots: 9, shows: 3 })
    ).toBe(0.5);
    expect(computeAvgCorrectPicksPerShow({ shows: 3 })).toBeNull();
    expect(formatAvgCorrectPicksPerShow(0.5)).toBe('0.5');
    expect(formatAvgCorrectPicksPerShow(null)).toBe('—');
  });
});
