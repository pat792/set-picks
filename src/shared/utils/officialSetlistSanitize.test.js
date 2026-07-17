import { describe, it, expect } from 'vitest';
import {
  sanitizeBustouts,
  sanitizeOfficialSongList,
  sanitizeSetlistSlots,
  sanitizeSongGaps,
} from './officialSetlistSanitize.js';

describe('sanitizeSetlistSlots', () => {
  it('trims values per slot id and fills missing with empty string', () => {
    const slotFields = [{ id: 's1o' }, { id: 's1c' }];
    expect(sanitizeSetlistSlots({ s1o: '  AC/DC Bag  ' }, slotFields)).toEqual({
      s1o: 'AC/DC Bag',
      s1c: '',
    });
  });
});

describe('sanitizeOfficialSongList', () => {
  it('trims and drops empties', () => {
    expect(sanitizeOfficialSongList(['  a ', '', 'b', '   '])).toEqual(['a', 'b']);
  });
  it('returns [] for non-array', () => {
    expect(sanitizeOfficialSongList(undefined)).toEqual([]);
  });
});

describe('sanitizeBustouts (#214)', () => {
  it('trims, drops empties, dedupes by lowercase form', () => {
    const input = ['  Foo  ', 'FOO', 'foo', 'Bar', '', null, '   '];
    expect(sanitizeBustouts(input)).toEqual(['Foo', 'Bar']);
  });
  it('preserves the first-seen casing for each normalized title', () => {
    expect(sanitizeBustouts(['AC/DC Bag', 'ac/dc bag'])).toEqual(['AC/DC Bag']);
    expect(sanitizeBustouts(['ac/dc bag', 'AC/DC Bag'])).toEqual(['ac/dc bag']);
  });
  it('returns [] for non-array input', () => {
    expect(sanitizeBustouts(undefined)).toEqual([]);
    expect(sanitizeBustouts(null)).toEqual([]);
    expect(sanitizeBustouts('foo')).toEqual([]);
  });
  it('drops non-string entries defensively', () => {
    expect(sanitizeBustouts([42, { x: 1 }, 'ok'])).toEqual(['ok']);
  });
});

describe('sanitizeSongGaps (#587 Phase B)', () => {
  it('normalizes keys and coerces integer gaps', () => {
    expect(sanitizeSongGaps({ '  Reba ': 12, 'AC/DC Bag': '47' })).toEqual({
      reba: 12,
      'ac/dc bag': 47,
    });
  });
  it('drops negative, non-finite, blank-key, and non-object input', () => {
    expect(sanitizeSongGaps({ foo: -1, bar: NaN, '   ': 5, ok: 3 })).toEqual({ ok: 3 });
    expect(sanitizeSongGaps(null)).toEqual({});
    expect(sanitizeSongGaps(['a', 'b'])).toEqual({});
    expect(sanitizeSongGaps('nope')).toEqual({});
  });
  it('truncates fractional gaps', () => {
    expect(sanitizeSongGaps({ tweezer: 30.9 })).toEqual({ tweezer: 30 });
  });
});
