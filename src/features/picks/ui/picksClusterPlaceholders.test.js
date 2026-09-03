import { describe, expect, it } from 'vitest';

import {
  PICKS_LAB_COMING_SOON_BODY,
  PICKS_LAB_COMING_SOON_TITLE,
} from './PicksLabComingSoon';
import {
  PICKS_SCORECARD_COMING_SOON_BODY,
  PICKS_SCORECARD_COMING_SOON_TITLE,
} from './PicksScorecardPlaceholder';

describe('Picks cluster destination copy (#766)', () => {
  it('keeps Lab coming-soon copy when the prediction flag is off', () => {
    expect(PICKS_LAB_COMING_SOON_TITLE).toMatch(/coming soon/i);
    expect(PICKS_LAB_COMING_SOON_BODY).toMatch(/tab stays visible/i);
  });

  it('keeps Scorecard as an empty shell (metrics are a sibling)', () => {
    expect(PICKS_SCORECARD_COMING_SOON_TITLE).toMatch(/coming soon/i);
    expect(PICKS_SCORECARD_COMING_SOON_BODY).toMatch(/Make Picks/i);
  });
});
