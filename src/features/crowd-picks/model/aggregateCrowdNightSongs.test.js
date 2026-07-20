import { describe, expect, it } from 'vitest';

import {
  aggregateCrowdNightSongs,
  crowdNightCardSummary,
  enrichSongRowsWithCatalog,
  enrichTopMultiWithCatalog,
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

  it('defaults to top 5 and enriches gap/last from catalog', () => {
    const stats = aggregateCrowdNightSongs('2026-07-17', DOCS);
    const card = crowdNightCardSummary(stats);
    expect(card.topMulti.length).toBeLessThanOrEqual(5);
    const enriched = enrichTopMultiWithCatalog(card.topMulti, [
      { name: 'Tweezer', gap: '12', last: '2024-07-19' },
      { name: 'Ghost', gap: '100', last: '2023-01-01' },
    ]);
    const tweezer = enriched.find((s) => s.title === 'Tweezer');
    expect(tweezer?.gap).toBe(12);
    expect(tweezer?.last).toBe('2024-07-19');
  });

  it('enrichSongRowsWithCatalog prefers frozen songGaps over catalog', () => {
    const enriched = enrichSongRowsWithCatalog(
      [{ title: 'Ghost', cardCount: 2, pctOfPickers: 50 }],
      [{ name: 'Ghost', gap: '0', last: '2026-07-19' }],
      { frozenGaps: { ghost: 47 } }
    );
    expect(enriched[0].gap).toBe(47);
    expect(enriched[0].last).toBe('2026-07-19');
  });

  it('enrichSongRowsWithCatalog preserves row fields and falls back to row gap', () => {
    const enriched = enrichSongRowsWithCatalog(
      [
        {
          title: 'Weird Fishes',
          cardCount: 2,
          gap: 44,
          subtitle: 'alice, bob',
        },
      ],
      [{ name: 'Weird Fishes', last: '2022-06-01' }]
    );
    expect(enriched[0].gap).toBe(44);
    expect(enriched[0].last).toBe('2022-06-01');
    expect(enriched[0].subtitle).toBe('alice, bob');
  });
});
