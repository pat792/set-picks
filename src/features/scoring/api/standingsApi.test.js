import { describe, expect, it } from 'vitest';

import { normalizeOfficialSetlistDocData } from './standingsApi';

describe('normalizeOfficialSetlistDocData', () => {
  it('returns null for empty / non-object input', () => {
    expect(normalizeOfficialSetlistDocData(undefined)).toBeNull();
    expect(normalizeOfficialSetlistDocData(null)).toBeNull();
  });

  it('maps officialSetlist, encoreSongs, and bustouts like fetch path', () => {
    const out = normalizeOfficialSetlistDocData({
      officialSetlist: ['A'],
      encoreSongs: ['E1'],
      bustouts: ['First Tube'],
      setlist: { foo: 1 },
    });
    expect(out?.officialSetlist).toEqual(['A']);
    expect(out?.encoreSongs).toEqual(['E1']);
    expect(out?.bustouts).toEqual(['First Tube']);
    expect(out?.foo).toBe(1);
  });
});
