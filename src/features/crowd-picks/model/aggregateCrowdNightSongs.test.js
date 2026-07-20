import { describe, expect, it } from 'vitest';

import {
  aggregateCrowdNightSongs,
  crowdNightCardSummary,
} from './aggregateCrowdNightSongs';

const DOCS = [
  {
    userId: 'a',
    picks: {
      s1o: 'Tweezer',
      s1c: 'Gin',
      s2o: 'Ghost',
      s2c: 'Hood',
      enc: 'Zero',
      wild: 'Free',
    },
  },
  {
    userId: 'b',
    picks: {
      s1o: 'Tweezer',
      s1c: 'Gin',
      s2o: 'Disease',
      s2c: 'Hood',
      enc: 'Tube',
      wild: 'Ghost',
    },
  },
  {
    userId: 'c',
    picks: {
      s1o: 'Sample',
      s1c: 'Antelope',
      s2o: 'Ghost',
      s2c: 'YEM',
      enc: 'Zero',
      wild: 'Tweezer',
    },
  },
  { userId: 'd', picks: { s1o: '  ' } },
];

describe('aggregateCrowdNightSongs (#690)', () => {
  it('counts pickers, unique songs, multi-picker filter', () => {
    const stats = aggregateCrowdNightSongs('2026-07-17', DOCS);
    expect(stats.pickers).toBe(3);
    expect(stats.uniqueSongs).toBeGreaterThan(5);
    expect(stats.multiPickerSongs.every((s) => s.cardCount >= 2)).toBe(true);
    const tweezer = stats.songs.find((s) => s.title === 'Tweezer');
    expect(tweezer?.cardCount).toBe(3);
    expect(tweezer?.pctOfPickers).toBe(100);
  });

  it('builds card v1 summary', () => {
    const stats = aggregateCrowdNightSongs('2026-07-17', DOCS);
    const card = crowdNightCardSummary(stats, { topN: 2 });
    expect(card.pickers).toBe(3);
    expect(card.uniqueSongs).toBe(stats.uniqueSongs);
    expect(card.topMulti.length).toBeLessThanOrEqual(2);
    expect(card.topMulti.every((s) => s.cardCount >= 2)).toBe(true);
  });
});
