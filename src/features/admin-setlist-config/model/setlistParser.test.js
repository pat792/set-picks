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
import { calculateSlotScore } from '../../../shared/utils/scoring.js';

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
    expect(parsed.encoreSongTitles).toEqual(['Song E']);
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
    expect(parsed.encoreSongTitles).toEqual(['Song E']);
    expect(parsed.playedSongOrder).toEqual(['Song A', 'Song B', 'Song C', 'Song D', 'Song E']);
  });

  it('withholds set closers until the next segment exists (Phish.net)', () => {
    const parsed = parseSetlist(
      {
        error: false,
        data: [
          { set: '1', song: 'A', position: 1 },
          { set: '1', song: 'B', position: 2 },
        ],
      },
      'phishnet',
      gameConfig,
    );
    expect(parsed.positionSlots.s1o).toBe('A');
    expect(parsed.positionSlots.s1c).toBe('');
    expect(parsed.encoreSongTitles).toEqual([]);
  });

  it('withholds set 2 closer until encore exists (Phish.net)', () => {
    const parsed = parseSetlist(
      {
        error: false,
        data: [
          { set: '1', song: 'A', position: 1 },
          { set: '1', song: 'B', position: 2 },
          { set: '2', song: 'C', position: 1 },
          { set: '2', song: 'D', position: 2 },
        ],
      },
      'phishnet',
      gameConfig,
    );
    expect(parsed.positionSlots.s1c).toBe('B');
    expect(parsed.positionSlots.s2o).toBe('C');
    expect(parsed.positionSlots.s2c).toBe('');
    expect(parsed.encoreSongTitles).toEqual([]);
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
    const { setlistData, officialSetlist, encoreSongs } = mapParsedSetlistToLegacySaveShape(
      parsed,
      ADMIN_SLOT_FIELDS,
    );

    expect(sanitizeSetlistSlots(setlistData, ADMIN_SLOT_FIELDS)).toEqual(setlistData);
    expect(sanitizeOfficialSongList(officialSetlist)).toEqual(officialSetlist);

    expect(Object.keys(setlistData).sort()).toEqual(['enc', 's1c', 's1o', 's2c', 's2o']);
    expect(setlistData.s1o).toBe('Song A');
    expect(officialSetlist).toHaveLength(5);
    expect(encoreSongs).toEqual(['Song E']);
  });
});

describe('encore exact scoring', () => {
  it('awards encore exact for any listed encore song', () => {
    const actual = {
      s1o: 'a',
      s1c: 'b',
      s2o: 'c',
      s2c: 'd',
      enc: 'First Encore',
      encoreSongs: ['First Encore', 'Second Encore'],
      officialSetlist: [],
    };
    expect(calculateSlotScore('enc', 'Second Encore', actual)).toBe(15);
  });
});

describe('parseSetlist bustoutTitles (#214)', () => {
  it('Phish.net: derives bustoutTitles from row gap >= BUSTOUT_MIN_GAP', () => {
    const parsed = parseSetlist(
      {
        error: false,
        data: [
          { set: '1', song: 'AC/DC Bag', position: 1, gap: 8 },
          { set: '1', song: 'Bathtub Gin', position: 2, gap: 14 },
          { set: '2', song: "Colonel Forbin's Ascent", position: 1, gap: 98 },
          { set: '2', song: 'Down with Disease', position: 2, gap: 2 },
          { set: 'e', song: "Fluff's Travels", position: 1, gap: 1884 },
        ],
      },
      'phishnet',
      gameConfig,
    );
    expect(parsed.bustoutTitles).toEqual([
      "Colonel Forbin's Ascent",
      "Fluff's Travels",
    ]);
  });

  it('Phish.net: accepts gap as numeric string, ignores non-numeric / negative', () => {
    const parsed = parseSetlist(
      {
        error: false,
        data: [
          { set: '1', song: 'A', position: 1, gap: '40' },
          { set: '1', song: 'B', position: 2, gap: '—' },
          { set: '1', song: 'C', position: 3, gap: -5 },
          { set: '1', song: 'D', position: 4 },
        ],
      },
      'phishnet',
      gameConfig,
    );
    expect(parsed.bustoutTitles).toEqual(['A']);
  });

  it('Phish.in: returns empty bustoutTitles (no gap metadata available)', () => {
    const parsed = parseSetlist(phishinFixture, 'phishin', gameConfig);
    expect(parsed.bustoutTitles).toEqual([]);
  });

  it('mapParsedSetlistToLegacySaveShape forwards bustouts', () => {
    const parsed = parseSetlist(
      {
        error: false,
        data: [
          { set: '1', song: 'A', position: 1, gap: 2 },
          { set: '1', song: 'B', position: 2, gap: 40 },
        ],
      },
      'phishnet',
      gameConfig,
    );
    const { bustouts } = mapParsedSetlistToLegacySaveShape(parsed, ADMIN_SLOT_FIELDS);
    expect(bustouts).toEqual(['B']);
  });
});
