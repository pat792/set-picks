import { describe, it, expect } from 'vitest';
import phishinFixture from './__fixtures__/phishin-setlist-min.json';
import phishnetFixture from './__fixtures__/phishnet-setlist-min.json';
import {
  parseSetlist,
  mapParsedSetlistToLegacySaveShape,
  SetlistParseError,
  normalizeSetlistApiSource,
} from './setlistParser.js';
import { FORM_FIELDS } from '../../../shared/data/gameConfig.js';
import {
  sanitizeSetlistSlots,
  sanitizeOfficialSongList,
} from '../../../shared/utils/officialSetlistSanitize.js';

const ADMIN_SLOT_FIELDS = FORM_FIELDS.filter((f) => f.id !== 'wild');

const gameConfig = { FORM_FIELDS };

describe('normalizeSetlistApiSource', () => {
  it('accepts phish.in and phishin', () => {
    expect(normalizeSetlistApiSource('phish.in')).toBe('phishin');
    expect(normalizeSetlistApiSource('PhishIn')).toBe('phishin');
  });
  it('accepts phish.net and phishnet', () => {
    expect(normalizeSetlistApiSource('phish.net')).toBe('phishnet');
  });
  it('rejects unknown', () => {
    expect(() => normalizeSetlistApiSource('other')).toThrow(SetlistParseError);
  });
});

describe('parseSetlist', () => {
  it('maps Phish.in tracks to slots and order', () => {
    const parsed = parseSetlist(phishinFixture, 'phishin', gameConfig);
    expect(parsed.positionSlots.s1o).toBe('Song A');
    expect(parsed.positionSlots.s1c).toBe('Song B');
    expect(parsed.positionSlots.s2o).toBe('Song C');
    expect(parsed.positionSlots.s2c).toBe('Song D');
    expect(parsed.positionSlots.enc).toBe('Song E');
    expect(parsed.positionSlots.wild).toBe('');
    expect(parsed.playedSongOrder).toEqual(['Song A', 'Song B', 'Song C', 'Song D', 'Song E']);
  });

  it('maps Phish.net data to slots and order', () => {
    const parsed = parseSetlist(phishnetFixture, 'phishnet', gameConfig);
    expect(parsed.positionSlots.s1o).toBe('Song A');
    expect(parsed.positionSlots.s1c).toBe('Song B');
    expect(parsed.positionSlots.s2o).toBe('Song C');
    expect(parsed.positionSlots.s2c).toBe('Song D');
    expect(parsed.positionSlots.enc).toBe('Song E');
    expect(parsed.playedSongOrder).toEqual(['Song A', 'Song B', 'Song C', 'Song D', 'Song E']);
  });

  it('throws on Phish.net API error field', () => {
    expect(() =>
      parseSetlist({ error: 2, error_message: 'bad', data: [] }, 'phishnet', gameConfig),
    ).toThrow(SetlistParseError);
  });
});

describe('mapParsedSetlistToLegacySaveShape', () => {
  it('matches sanitizeSetlistSlots + sanitizeOfficialSongList contract for saveOfficialSetlistByDate', () => {
    const parsed = parseSetlist(phishinFixture, 'phishin', gameConfig);
    const { setlistData, officialSetlist } = mapParsedSetlistToLegacySaveShape(parsed, ADMIN_SLOT_FIELDS);

    expect(sanitizeSetlistSlots(setlistData, ADMIN_SLOT_FIELDS)).toEqual(setlistData);
    expect(sanitizeOfficialSongList(officialSetlist)).toEqual(officialSetlist);

    expect(Object.keys(setlistData).sort()).toEqual(['enc', 's1c', 's1o', 's2c', 's2o']);
    expect(setlistData.s1o).toBe('Song A');
    expect(officialSetlist).toHaveLength(5);
  });
});
