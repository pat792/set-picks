import { describe, expect, it } from 'vitest';

import {
  buildOfficialPlayedTitleSet,
  isCrowdSongPlayed,
} from './buildOfficialPlayedTitleSet';

describe('buildOfficialPlayedTitleSet', () => {
  it('returns empty set when setlist missing', () => {
    expect(buildOfficialPlayedTitleSet(null).size).toBe(0);
    expect(buildOfficialPlayedTitleSet(undefined).size).toBe(0);
  });

  it('unions slot songs, officialSetlist, and encoreSongs', () => {
    const played = buildOfficialPlayedTitleSet({
      s1o: 'Tweezer',
      s2c: 'Ghost',
      officialSetlist: ['Free', 'Tweezer', 'YEM'],
      encoreSongs: ['Zero'],
      songGaps: { tweezer: 12 },
      bustouts: ['Ghost'],
    });
    expect(played.has('tweezer')).toBe(true);
    expect(played.has('ghost')).toBe(true);
    expect(played.has('free')).toBe(true);
    expect(played.has('yem')).toBe(true);
    expect(played.has('zero')).toBe(true);
    // Metadata keys must not leak as titles
    expect([...played].some((t) => t.includes('12'))).toBe(false);
  });
});

describe('isCrowdSongPlayed', () => {
  it('matches case-insensitively', () => {
    const played = buildOfficialPlayedTitleSet({
      officialSetlist: ['Bathtub Gin'],
    });
    expect(isCrowdSongPlayed('bathtub gin', played)).toBe(true);
    expect(isCrowdSongPlayed('Ghost', played)).toBe(false);
  });
});
