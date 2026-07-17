import { describe, expect, it } from 'vitest';

import { aggregateTourSetlistStats } from './aggregateTourSetlistStats';

describe('aggregateTourSetlistStats (#555)', () => {
  it('returns empty stats for empty input', () => {
    expect(aggregateTourSetlistStats([], { tourShowCount: 3 })).toEqual({
      tourShowCount: 3,
      showsWithSetlist: 0,
      uniqueSongs: 0,
      totalSongPlays: 0,
      topSongs: [],
      bustouts: [],
      gapHighlights: [],
    });
  });

  it('counts unique songs once per show and ranks by frequency', () => {
    const stats = aggregateTourSetlistStats(
      [
        {
          showDate: '2026-07-10',
          setlist: {
            officialSetlist: ['Tweezer', 'Free', 'Tweezer'],
            bustouts: [],
            songGaps: { tweezer: 2, free: 5 },
          },
        },
        {
          showDate: '2026-07-11',
          setlist: {
            officialSetlist: ['Free', 'Ghost'],
            bustouts: ['Ghost'],
            songGaps: { free: 1, ghost: 40 },
          },
        },
      ],
      { tourShowCount: 4, topN: 10, gapHighlightMin: 20 },
    );

    expect(stats.showsWithSetlist).toBe(2);
    expect(stats.tourShowCount).toBe(4);
    expect(stats.uniqueSongs).toBe(3);
    expect(stats.totalSongPlays).toBe(4);
    expect(stats.topSongs[0]).toMatchObject({ title: 'Free', timesPlayed: 2 });
    expect(stats.bustouts).toEqual([
      { title: 'Ghost', showDate: '2026-07-11', gap: 40 },
    ]);
  });

  it('surfaces non-bustout gap highlights above the threshold', () => {
    const stats = aggregateTourSetlistStats(
      [
        {
          showDate: '2026-07-12',
          setlist: {
            officialSetlist: ['Reba', 'Dinner and a Movie'],
            bustouts: ['Dinner and a Movie'],
            songGaps: { reba: 25, 'dinner and a movie': 82 },
          },
        },
      ],
      { gapHighlightMin: 20 },
    );
    expect(stats.gapHighlights).toEqual([
      { title: 'Reba', showDate: '2026-07-12', gap: 25 },
    ]);
    expect(stats.bustouts[0].title).toBe('Dinner and a Movie');
  });
});
