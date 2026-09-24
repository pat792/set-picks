import { describe, expect, it } from 'vitest';

import {
  PICKS_LAB_COMING_SOON_BODY,
  PICKS_LAB_COMING_SOON_TITLE,
} from './PicksLabComingSoon';

describe('Picks cluster destination copy (#766)', () => {
  it('keeps Lab coming-soon copy when the prediction flag is off', () => {
    expect(PICKS_LAB_COMING_SOON_TITLE).toMatch(/coming soon/i);
    expect(PICKS_LAB_COMING_SOON_BODY).toMatch(/tab stays visible/i);
  });
});
