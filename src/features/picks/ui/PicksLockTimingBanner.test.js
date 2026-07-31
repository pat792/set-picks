import { describe, expect, it } from 'vitest';

import { buildPicksLockTimingMessage } from './PicksLockTimingBanner';

describe('buildPicksLockTimingMessage', () => {
  it('explains the ticket-time-based lock for tonight', () => {
    expect(
      buildPicksLockTimingMessage({
        date: '2026-07-18',
        doorsLocal: '17:30',
        scheduledStartLocal: '19:00',
        picksLockLocal: '19:20',
        picksLockSource: 'scheduledStart',
      })
    ).toBe(
      'Picks lock at 7:20 PM — 20 minutes after tonight’s published ticket time (7:00 PM).'
    );
  });

  it('shows only the venue-local fallback when show time is unknown', () => {
    expect(buildPicksLockTimingMessage({ date: '2099-01-01' })).toBe(
      'Picks lock at 7:30 PM venue-local.'
    );
  });
});
