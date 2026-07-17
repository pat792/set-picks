import { describe, expect, it } from 'vitest';

import {
  buildBustoutTitleSet,
  groupOfficialSetlistBySet,
  isOfficialSetlistBustout,
} from './groupOfficialSetlistBySet';

describe('groupOfficialSetlistBySet', () => {
  it('returns empty groups for null/invalid', () => {
    expect(groupOfficialSetlistBySet(null)).toEqual({
      set1: [],
      set2: [],
      encore: [],
      hasSongs: false,
      hasOfficialSlots: false,
    });
    expect(groupOfficialSetlistBySet(undefined).hasSongs).toBe(false);
  });

  it('keeps early-show songs in set 1 before s2o lands', () => {
    const grouped = groupOfficialSetlistBySet({
      s1o: 'Martian Monster',
      officialSetlist: ['Martian Monster', 'Free', 'Bathtub Gin'],
    });
    expect(grouped.set1).toEqual(['Martian Monster', 'Free', 'Bathtub Gin']);
    expect(grouped.set2).toEqual([]);
    expect(grouped.encore).toEqual([]);
    expect(grouped.hasSongs).toBe(true);
    expect(grouped.hasOfficialSlots).toBe(true);
  });

  it('splits on s2o and pulls encore from encoreSongs', () => {
    const grouped = groupOfficialSetlistBySet({
      s1o: 'Martian Monster',
      s1c: 'Bathtub Gin',
      s2o: 'Down with Disease',
      s2c: 'Harry Hood',
      enc: 'First Tube',
      officialSetlist: [
        'Martian Monster',
        'Free',
        'Bathtub Gin',
        'Down with Disease',
        'Light',
        'Harry Hood',
        'First Tube',
      ],
      encoreSongs: ['First Tube'],
    });
    expect(grouped.set1).toEqual(['Martian Monster', 'Free', 'Bathtub Gin']);
    expect(grouped.set2).toEqual(['Down with Disease', 'Light', 'Harry Hood']);
    expect(grouped.encore).toEqual(['First Tube']);
  });

  it('falls back to enc slot when encoreSongs is missing', () => {
    const grouped = groupOfficialSetlistBySet({
      s2o: 'Down with Disease',
      enc: 'Character Zero',
      officialSetlist: [
        'Martian Monster',
        'Down with Disease',
        'Harry Hood',
        'Character Zero',
      ],
    });
    expect(grouped.set1).toEqual(['Martian Monster']);
    expect(grouped.set2).toEqual(['Down with Disease', 'Harry Hood']);
    expect(grouped.encore).toEqual(['Character Zero']);
  });

  it('prefers encoreSongs list over list slice when songs already split', () => {
    const grouped = groupOfficialSetlistBySet({
      s2o: 'Tweezer',
      enc: 'Tweezer Reprise',
      officialSetlist: ['Chalk Dust Torture', 'Tweezer', 'Tweezer Reprise'],
      encoreSongs: ['Tweezer Reprise', 'First Tube'],
    });
    expect(grouped.set1).toEqual(['Chalk Dust Torture']);
    expect(grouped.set2).toEqual(['Tweezer']);
    expect(grouped.encore).toEqual(['Tweezer Reprise', 'First Tube']);
  });

  it('flags hasOfficialSlots when only slots exist', () => {
    const grouped = groupOfficialSetlistBySet({
      s1o: 'Sample in a Jar',
      officialSetlist: [],
    });
    expect(grouped.hasSongs).toBe(false);
    expect(grouped.hasOfficialSlots).toBe(true);
  });

  it('builds a normalized bustout title lookup for setlist rows', () => {
    const bustouts = buildBustoutTitleSet({
      bustouts: [" Colonel Forbin's Ascent ", "FLUFF'S TRAVELS", ''],
    });

    expect(isOfficialSetlistBustout("colonel forbin's ascent", bustouts)).toBe(true);
    expect(isOfficialSetlistBustout("Fluff's Travels", bustouts)).toBe(true);
    expect(isOfficialSetlistBustout('Tweezer', bustouts)).toBe(false);
    expect(isOfficialSetlistBustout('Tweezer', buildBustoutTitleSet(null))).toBe(false);
  });
});
