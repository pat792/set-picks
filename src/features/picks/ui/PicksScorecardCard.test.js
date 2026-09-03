import { describe, expect, it } from 'vitest';

import {
  SCORECARD_EMPTY_BODY,
  SCORECARD_EMPTY_TITLE,
  SCORECARD_LOCKED_UNGRADED_COPY,
  SCORECARD_PRE_LOCK_COPY,
} from './PicksScorecardCard';

describe('PicksScorecardCard copy (#767)', () => {
  it('keeps empty-state guidance to Make Picks', () => {
    expect(SCORECARD_EMPTY_TITLE).toMatch(/no picks/i);
    expect(SCORECARD_EMPTY_BODY).toMatch(/Make Picks/i);
  });

  it('explains that overlap waits until lock', () => {
    expect(SCORECARD_PRE_LOCK_COPY).toMatch(/overlap/i);
    expect(SCORECARD_PRE_LOCK_COPY).toMatch(/lock/i);
  });

  it('explains locked / ungraded rank pending', () => {
    expect(SCORECARD_LOCKED_UNGRADED_COPY).toMatch(/locked/i);
    expect(SCORECARD_LOCKED_UNGRADED_COPY).toMatch(/setlist/i);
  });
});
