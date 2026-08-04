import { describe, expect, it } from 'vitest';

import {
  formatAvgCorrectPicksPerShow,
  PROFILE_SLOTS_PER_SHOW,
} from './pickAverages.js';

describe('pickAverages', () => {
  it('exposes slots-per-show from form fields', () => {
    expect(PROFILE_SLOTS_PER_SHOW).toBeGreaterThan(0);
  });

  it('formats batting-average style ratios', () => {
    expect(formatAvgCorrectPicksPerShow(0.5)).toBe('.500');
    expect(formatAvgCorrectPicksPerShow(1 / 6)).toBe('.167');
    expect(formatAvgCorrectPicksPerShow(1)).toBe('1.000');
    expect(formatAvgCorrectPicksPerShow(null)).toBe('—');
  });
});
