import { describe, expect, it } from 'vitest';

import { aggregatePickSongStats } from './aggregatePickSongStats';

describe('aggregatePickSongStats', () => {
  const setlist = {
    s1o: 'Tweezer',
    s1c: 'Golgi Apparatus',
    s2o: 'Ghost',
    s2c: 'You Enjoy Myself',
    enc: 'Tweezer Reprise',
    wild: '',
    officialSetlist: ['Tweezer', 'Ghost', 'You Enjoy Myself', 'Tweezer Reprise'],
    bustouts: ['Ghost'],
  };

  it('ranks by pick frequency and counts hit kinds', () => {
    const { rows, songTitles, showsAggregated } = aggregatePickSongStats(
      [
        {
          showDate: '2026-07-01',
          picks: {
            s1o: 'Tweezer',
            s1c: 'Wilson',
            s2o: 'Ghost',
            s2c: 'YEM',
            enc: 'Tweezer Reprise',
            wild: 'Ghost',
          },
        },
        {
          showDate: '2026-07-02',
          picks: {
            s1o: 'Tweezer',
            s1c: 'Wilson',
            s2o: 'Free',
            s2c: 'YEM',
            enc: 'Character Zero',
            wild: 'Tweezer',
          },
        },
      ],
      { '2026-07-01': setlist, '2026-07-02': setlist },
      { topN: 5 }
    );

    expect(showsAggregated).toBe(2);
    expect(rows[0].title).toBe('Tweezer');
    expect(rows[0].pickedCount).toBe(3);
    expect(rows[0].correctCount).toBeGreaterThan(0);
    expect(songTitles).toContain('Tweezer');
    expect(rows.length).toBeLessThanOrEqual(5);
  });

  it('still counts frequency when setlist is missing', () => {
    const { rows } = aggregatePickSongStats(
      [
        {
          showDate: '2026-07-01',
          picks: { s1o: 'Tweezer', wild: 'Ghost' },
        },
      ],
      new Map(),
      { topN: 10 }
    );
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Tweezer',
          pickedCount: 1,
          correctCount: 0,
        }),
        expect.objectContaining({
          title: 'Ghost',
          pickedCount: 1,
          correctCount: 0,
        }),
      ])
    );
    expect(rows).toHaveLength(2);
  });
});
