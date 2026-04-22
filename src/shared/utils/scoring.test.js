import { describe, it, expect } from 'vitest';
import {
  SCORING_RULES,
  calculateSlotScore,
  calculateTotalScore,
  getSlotScoreBreakdown,
} from './scoring.js';

/**
 * Per-show `bustouts` snapshot read path (#214).
 *
 * These tests pin the invariant that bustout boosts come from the
 * `actualSetlist.bustouts` array on the official setlist doc — not a song
 * catalog. Absence or empty array must mean "no boost"; no fallback lookup.
 */
describe('scoring: bustout boost reads actualSetlist.bustouts (#214)', () => {
  const baseSetlist = {
    s1o: 'AC/DC Bag',
    s1c: 'Bathtub Gin',
    s2o: "Colonel Forbin's Ascent",
    s2c: 'Down with Disease',
    enc: 'Tweezer Reprise',
    officialSetlist: [
      'AC/DC Bag',
      'Bathtub Gin',
      "Colonel Forbin's Ascent",
      'Down with Disease',
      'Tweezer Reprise',
    ],
  };

  it('awards BUSTOUT_BOOST when the pick matches a bustout entry', () => {
    const actual = { ...baseSetlist, bustouts: ["Colonel Forbin's Ascent"] };
    // Wildcard hit (10) + bustout boost (20) = 30
    expect(calculateSlotScore('wild', "Colonel Forbin's Ascent", actual)).toBe(
      SCORING_RULES.WILDCARD_HIT + SCORING_RULES.BUSTOUT_BOOST,
    );
    // Exact slot (10) + bustout boost (20) = 30
    expect(calculateSlotScore('s2o', "Colonel Forbin's Ascent", actual)).toBe(
      SCORING_RULES.EXACT_SLOT + SCORING_RULES.BUSTOUT_BOOST,
    );
  });

  it('no bustout boost when the pick is not in bustouts', () => {
    const actual = { ...baseSetlist, bustouts: ["Colonel Forbin's Ascent"] };
    // Wildcard hit only, no boost
    expect(calculateSlotScore('wild', 'AC/DC Bag', actual)).toBe(
      SCORING_RULES.WILDCARD_HIT,
    );
  });

  it('treats absent bustouts as empty (no boost, no catalog fallback)', () => {
    const actual = { ...baseSetlist }; // no bustouts field
    expect(calculateSlotScore('wild', "Colonel Forbin's Ascent", actual)).toBe(
      SCORING_RULES.WILDCARD_HIT,
    );
  });

  it('treats empty bustouts array as no boost', () => {
    const actual = { ...baseSetlist, bustouts: [] };
    expect(calculateSlotScore('wild', "Colonel Forbin's Ascent", actual)).toBe(
      SCORING_RULES.WILDCARD_HIT,
    );
  });

  it('matches bustout entries case-insensitively', () => {
    const actual = { ...baseSetlist, bustouts: ['colonel forbins ascent', 'DOWN WITH DISEASE'] };
    // Different casing/punctuation normalize via `String#toLowerCase().trim()`.
    // "Colonel Forbin's Ascent" vs "colonel forbins ascent" differs in the
    // apostrophe, so guard against accidental matches: exact normalize only.
    expect(calculateSlotScore('s2c', 'Down with Disease', actual)).toBe(
      SCORING_RULES.EXACT_SLOT + SCORING_RULES.BUSTOUT_BOOST,
    );
  });

  it('getSlotScoreBreakdown surfaces bustoutBoost flag', () => {
    const actual = { ...baseSetlist, bustouts: ['AC/DC Bag'] };
    const result = getSlotScoreBreakdown('s1o', 'AC/DC Bag', actual);
    expect(result.points).toBe(SCORING_RULES.EXACT_SLOT + SCORING_RULES.BUSTOUT_BOOST);
    expect(result.bustoutBoost).toBe(true);
    expect(result.kind).toBe('exact_slot');

    const noBoost = getSlotScoreBreakdown('s1c', 'Bathtub Gin', actual);
    expect(noBoost.bustoutBoost).toBe(false);
  });

  it('drops non-string entries in bustouts defensively', () => {
    const actual = {
      ...baseSetlist,
      bustouts: [null, 42, { title: 'x' }, "Colonel Forbin's Ascent"],
    };
    expect(calculateSlotScore('wild', "Colonel Forbin's Ascent", actual)).toBe(
      SCORING_RULES.WILDCARD_HIT + SCORING_RULES.BUSTOUT_BOOST,
    );
  });

  it('calculateTotalScore sums base + boosts across slots', () => {
    const actual = { ...baseSetlist, bustouts: ["Colonel Forbin's Ascent"] };
    const picks = {
      s1o: 'AC/DC Bag', // exact slot, no bustout = 10
      s1c: 'Bathtub Gin', // exact slot, no bustout = 10
      s2o: "Colonel Forbin's Ascent", // exact slot + bustout = 30
      s2c: 'wrong', // miss = 0
      enc: 'Tweezer Reprise', // encore exact = 15
      wild: 'Down with Disease', // wildcard hit = 10
    };
    expect(calculateTotalScore(picks, actual)).toBe(10 + 10 + 30 + 0 + 15 + 10);
  });
});
