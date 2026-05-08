import { describe, it, expect } from 'vitest';

import { SHARE_RECAP_ARTIST_NAME } from '../../../shared/data/gameConfig';
import {
  buildGradedPicksShareBodyPlain,
  buildGradedPicksShareClipboardHtml,
  buildGradedPicksShareEmojiGrid,
  buildGradedPicksShareFullPlainText,
  buildGradedPicksShareSlots,
  GRADED_PICKS_SHARE_RECAP_TITLE,
  GRADED_PICKS_SHARE_SITE_URL,
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

  it('buildGradedPicksShareBodyPlain uses artist · date and colored block grid', () => {
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
    expect(body).toContain(`${SHARE_RECAP_ARTIST_NAME} · 2025-01-01 Miami`);
    expect(body).toContain('🟩');
    expect(body).toContain('🟦');
    expect(body).toContain('⬛');
    expect(body).toContain('BB = Bustout Boost™');
    expect(body).toContain(GRADED_PICKS_SHARE_SITE_URL);
  });

  it('buildGradedPicksShareEmojiGrid pads bustout slot with BB suffix', () => {
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
    const grid = buildGradedPicksShareEmojiGrid(slots, picks);
    expect(grid).toContain('BB');
  });

  it('buildGradedPicksShareFullPlainText includes headline once', () => {
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

  it('buildGradedPicksShareClipboardHtml embeds image and artist · date', () => {
    const html = buildGradedPicksShareClipboardHtml({
      imageDataUrl: 'data:image/png;base64,AAA',
      showLabel: '2025-01-01 <em>x</em>',
      totalPoints: 55,
    });
    expect(html).toContain('data:image/png;base64,AAA');
    expect(html).toContain('&lt;em&gt;');
    expect(html).toContain('55 pts');
    expect(html).toContain(SHARE_RECAP_ARTIST_NAME);
    expect(html).toMatch(/href="https:\/\/www\.setlistpickem\.com\/"/);
  });
});
