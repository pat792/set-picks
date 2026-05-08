import { describe, it, expect } from 'vitest';

import { SCORING_RULES } from '../../../shared/utils/scoring.js';
import {
  buildGradedPicksShareSlots,
  buildGradedPicksShareText,
  GRADED_PICKS_SHARE_BRAND,
} from './gradedPicksShareCore.js';

describe('gradedPicksShareCore', () => {
  const baseSetlist = {
    s1o: 'AC/DC Bag',
    s1c: 'Bathtub Gin',
    s2o: "Colonel Forbin's Ascent",
    s2c: 'Down with Disease',
    enc: 'Tweezer Reprise',
    wild: '',
    officialSetlist: [
      'AC/DC Bag',
      'Bathtub Gin',
      "Colonel Forbin's Ascent",
      'Down with Disease',
      'Tweezer Reprise',
    ],
  };

  it('buildGradedPicksShareSlots matches getSlotScoreBreakdown order (FORM_FIELDS)', () => {
    const actual = { ...baseSetlist, bustouts: ['AC/DC Bag'] };
    const picks = {
      s1o: 'AC/DC Bag',
      s1c: 'Bathtub Gin',
      s2o: 'Wrong',
      s2c: 'Down with Disease',
      enc: 'Tweezer Reprise',
      wild: 'AC/DC Bag',
    };
    const slots = buildGradedPicksShareSlots(picks, actual);
    expect(slots).toHaveLength(6);
    expect(slots[0].fieldId).toBe('s1o');
    expect(slots[0].bustoutBoost).toBe(true);
    expect(slots[0].kind).toBe('exact_slot');
    expect(slots[2].kind).toBe('miss');
  });

  it('buildGradedPicksShareText includes brand, bustout star line, and emoji rows', () => {
    const actual = { ...baseSetlist, bustouts: ['AC/DC Bag'] };
    const picks = {
      s1o: 'AC/DC Bag',
      s1c: 'Bathtub Gin',
      s2o: 'Nope',
      s2c: 'Down with Disease',
      enc: 'Tweezer Reprise',
      wild: 'AC/DC Bag',
    };
    const text = buildGradedPicksShareText({
      userPicks: picks,
      actualSetlist: actual,
      showLabel: '2025-01-01 Miami',
    });
    expect(text).toContain(GRADED_PICKS_SHARE_BRAND);
    expect(text).toContain('2025-01-01 Miami');
    expect(text).toContain('⭐');
    expect(text).toContain(
      `🟩⭐${SCORING_RULES.EXACT_SLOT + SCORING_RULES.BUSTOUT_BOOST}`,
    );
    expect(text).toContain('⬛0');
  });
});
