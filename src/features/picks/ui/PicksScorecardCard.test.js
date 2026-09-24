import { describe, expect, it } from 'vitest';

import {
  SCORECARD_EMPTY_BODY,
  SCORECARD_EMPTY_TITLE,
  SCORECARD_HINT,
  SCORECARD_LOCKED_UNGRADED_COPY,
} from './PicksScorecardCard';

describe('PicksScorecardCard copy (#767)', () => {
  it('keeps empty-state guidance to Make Picks', () => {
    expect(SCORECARD_EMPTY_TITLE).toMatch(/no picks/i);
    expect(SCORECARD_EMPTY_BODY).toMatch(/Make Picks/i);
  });

  it('explains odds in plain language and showtime comparison in the header hint', () => {
    expect(SCORECARD_HINT).toMatch(/best guess/i);
    expect(SCORECARD_HINT).toMatch(/showtime/i);
    expect(SCORECARD_HINT).toMatch(/Standings/i);
    expect(SCORECARD_HINT).not.toMatch(/predictive|Overlap unlocks|model odds/i);
  });

  it('explains locked / ungraded rank pending', () => {
    expect(SCORECARD_LOCKED_UNGRADED_COPY).toMatch(/locked/i);
    expect(SCORECARD_LOCKED_UNGRADED_COPY).toMatch(/setlist/i);
  });
});
