import { describe, expect, it } from 'vitest';

import { buildPicksLockTimingMessage } from './PicksLockTimingBanner';

describe('buildPicksLockTimingMessage', () => {
  it('explains the doors-based lock for tonight', () => {
    expect(
      buildPicksLockTimingMessage({
        date: '2026-07-18',
        doorsLocal: '17:30',
        picksLockLocal: '18:55',
        picksLockSource: 'doors',
      })
    ).toBe(
      'Picks lock at 6:55 PM — 1 hour 25 minutes after tonight’s published doors time (5:30 PM).'
    );
  });

  it('shows only the venue-local fallback when doors are unknown', () => {
    expect(buildPicksLockTimingMessage({ date: '2099-01-01' })).toBe(
      'Picks lock at 7:30 PM venue-local.'
    );
  });
});
