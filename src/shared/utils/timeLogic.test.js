import { describe, expect, it } from 'vitest';

import { shouldRedactOpponentPicksPreLock } from './timeLogic';

describe('shouldRedactOpponentPicksPreLock (#303)', () => {
  it('redacts before picks lock / grading when show is still NEXT', () => {
    expect(shouldRedactOpponentPicksPreLock(null, 'NEXT')).toBe(true);
    expect(shouldRedactOpponentPicksPreLock(undefined, 'NEXT')).toBe(true);
  });

  it('does not redact once a setlist exists', () => {
    expect(shouldRedactOpponentPicksPreLock({ s1o: 'Fee' }, 'NEXT')).toBe(false);
  });

  it('does not redact after wall-clock lock (LIVE) without setlist yet', () => {
    expect(shouldRedactOpponentPicksPreLock(null, 'LIVE')).toBe(false);
  });

  it('does not redact for other statuses', () => {
    expect(shouldRedactOpponentPicksPreLock(null, 'PAST')).toBe(false);
    expect(shouldRedactOpponentPicksPreLock(null, 'FUTURE')).toBe(false);
  });
});
