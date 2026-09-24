import { describe, expect, it } from 'vitest';

import { PICKS_ODDS_HINT, PICKS_ODDS_LABEL } from './picksOddsCopy';

describe('picksOddsCopy', () => {
  it('uses a short Odds label and user-friendly hint', () => {
    expect(PICKS_ODDS_LABEL).toBe('Odds');
    expect(PICKS_ODDS_HINT).toMatch(/best guess/i);
    expect(PICKS_ODDS_HINT).toMatch(/tonight/i);
    expect(PICKS_ODDS_HINT).not.toMatch(/predictive|playProb|artifact|model odds/i);
  });
});
