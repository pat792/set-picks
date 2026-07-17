import { describe, expect, it } from 'vitest';

import {
  computeAvgPointsPerShow,
  formatAvgPointsPerShow,
} from './profileAverages';

describe('profileAverages', () => {
  it('computes avg points per show from career totals', () => {
    expect(computeAvgPointsPerShow({ totalPoints: 210, shows: 5 })).toBe(42);
    expect(computeAvgPointsPerShow({ totalPoints: 100, shows: 3 })).toBeCloseTo(
      100 / 3
    );
  });

  it('returns null when shows are missing or zero', () => {
    expect(computeAvgPointsPerShow({ totalPoints: 10, shows: 0 })).toBeNull();
    expect(computeAvgPointsPerShow({ totalPoints: 10 })).toBeNull();
    expect(computeAvgPointsPerShow(null)).toBeNull();
  });

  it('formats display with at most one decimal', () => {
    expect(formatAvgPointsPerShow(42)).toBe('42');
    expect(formatAvgPointsPerShow(100 / 3)).toBe('33.3');
    expect(formatAvgPointsPerShow(null)).toBe('—');
  });
});
