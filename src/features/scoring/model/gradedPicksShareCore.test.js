import { describe, it, expect } from 'vitest';

import { SCORING_RULES } from '../../../shared/utils/scoring.js';
import {
  buildGradedPicksShareBodyPlain,
  buildGradedPicksShareFullPlainText,
  buildGradedPicksShareHtml,
  buildGradedPicksShareSlots,
  GRADED_PICKS_SHARE_BRAND,
  GRADED_PICKS_SHARE_RECAP_TITLE,
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

  it('buildGradedPicksShareBodyPlain omits recap headline (safe with Web Share title)', () => {
    const actual = { ...baseSetlist, bustouts: ['AC/DC Bag'] };
    const picks = {
      s1o: 'AC/DC Bag',
      s1c: 'Bathtub Gin',
      s2o: 'Nope',
      s2c: 'Down with Disease',
      enc: 'Tweezer Reprise',
      wild: 'AC/DC Bag',
    };
    const body = buildGradedPicksShareBodyPlain({
      userPicks: picks,
      actualSetlist: actual,
      showLabel: '2025-01-01 Miami',
    });
    expect(body).not.toContain(GRADED_PICKS_SHARE_RECAP_TITLE);
    expect(body).toContain(GRADED_PICKS_SHARE_BRAND);
    expect(body).toContain('Set 1 Opener');
    const bustPts = SCORING_RULES.EXACT_SLOT + SCORING_RULES.BUSTOUT_BOOST;
    expect(body).toContain(`${bustPts} pts`);
    expect(body).toContain('Bustout Boost™');
    expect(body).toContain('█');
  });

  it('buildGradedPicksShareFullPlainText includes headline once then body', () => {
    const actual = { ...baseSetlist, bustouts: [] };
    const picks = {
      s1o: 'AC/DC Bag',
      s1c: 'Bathtub Gin',
      s2o: "Colonel Forbin's Ascent",
      s2c: 'Down with Disease',
      enc: 'Tweezer Reprise',
      wild: 'AC/DC Bag',
    };
    const full = buildGradedPicksShareFullPlainText({
      userPicks: picks,
      actualSetlist: actual,
      showLabel: '2025-01-01 Miami',
    });
    expect(full.startsWith(GRADED_PICKS_SHARE_RECAP_TITLE)).toBe(true);
    const n = full.split(GRADED_PICKS_SHARE_RECAP_TITLE).length - 1;
    expect(n).toBe(1);
  });

  it('buildGradedPicksShareHtml escapes show label and includes colored table', () => {
    const actual = { ...baseSetlist, bustouts: [] };
    const picks = {
      s1o: 'AC/DC Bag',
      s1c: 'Bathtub Gin',
      s2o: "Colonel Forbin's Ascent",
      s2c: 'Down with Disease',
      enc: 'Tweezer Reprise',
      wild: 'AC/DC Bag',
    };
    const html = buildGradedPicksShareHtml({
      userPicks: picks,
      actualSetlist: actual,
      showLabel: '2025-01-01 <script>',
    });
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('#134e4a');
    expect(html).toContain('<table');
  });
});
