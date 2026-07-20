import { describe, expect, it } from 'vitest';

import { meterIntensity } from './meterIntensity';

describe('meterIntensity (#694)', () => {
  it('floors tiny shares so the bar stays visible', () => {
    expect(meterIntensity(1, 100)).toBe(0.12);
  });

  it('scales to max', () => {
    expect(meterIntensity(5, 5)).toBe(1);
    expect(meterIntensity(2, 4)).toBe(0.5);
  });

  it('handles empty max', () => {
    expect(meterIntensity(3, 0)).toBe(0.12);
  });
});
