import { describe, expect, it } from 'vitest';

import {
  PICKS_LAB_CARD_DRAFT_HINT,
  PICKS_LAB_CARD_EMPTY_HINT,
  PICKS_LAB_CARD_SAVED_HINT,
  PICKS_LAB_CARD_TITLE,
  PICKS_LAB_CARD_UPDATE_HINT,
} from './PicksLabCardSummary';

describe('PicksLabCardSummary copy', () => {
  it('names the live card and explains draft vs save', () => {
    expect(PICKS_LAB_CARD_TITLE).toMatch(/your card/i);
    expect(PICKS_LAB_CARD_EMPTY_HINT).toMatch(/use a recommendation/i);
    expect(PICKS_LAB_CARD_DRAFT_HINT).toMatch(/not saved/i);
    expect(PICKS_LAB_CARD_DRAFT_HINT).toMatch(/lock picks/i);
    expect(PICKS_LAB_CARD_UPDATE_HINT).toMatch(/update picks/i);
    expect(PICKS_LAB_CARD_SAVED_HINT).toMatch(/saved/i);
  });
});
