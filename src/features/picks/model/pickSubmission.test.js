import { describe, expect, it } from 'vitest';

import {
  hasNonEmptyPicksObject,
  pickEntryHasSubmission,
  userHasSubmittedPickEntry,
} from './pickSubmission';

describe('pickSubmission', () => {
  it('detects non-empty picks maps', () => {
    expect(hasNonEmptyPicksObject({ opener: 'Tweezer' })).toBe(true);
    expect(hasNonEmptyPicksObject({ opener: '  ' })).toBe(false);
    expect(hasNonEmptyPicksObject(null)).toBe(false);
  });

  it('reads submission from pick query rows', () => {
    const rows = [
      { userId: 'u1', picks: { opener: 'Fluffhead' } },
      { userId: 'u2', picks: {} },
    ];
    expect(userHasSubmittedPickEntry(rows, 'u1')).toBe(true);
    expect(userHasSubmittedPickEntry(rows, 'u2')).toBe(false);
    expect(userHasSubmittedPickEntry(rows, 'u3')).toBe(false);
  });

  it('supports legacy flat pick fields on entries', () => {
    expect(pickEntryHasSubmission({ userId: 'u1', s1o: 'Wilson' })).toBe(true);
  });
});
