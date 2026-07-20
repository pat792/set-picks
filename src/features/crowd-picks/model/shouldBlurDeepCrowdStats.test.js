import { describe, expect, it } from 'vitest';

import { shouldBlurDeepCrowdStats } from './shouldBlurDeepCrowdStats';

describe('shouldBlurDeepCrowdStats (#694 / #689)', () => {
  it('blurs only while picks are still editable (NEXT)', () => {
    expect(shouldBlurDeepCrowdStats('NEXT')).toBe(true);
    expect(shouldBlurDeepCrowdStats('LIVE')).toBe(false);
    expect(shouldBlurDeepCrowdStats('PAST')).toBe(false);
    expect(shouldBlurDeepCrowdStats('')).toBe(false);
  });
});
