import { describe, expect, it } from 'vitest';

import {
  GLOBAL_LEADERBOARD_MIN_SHOWS,
  GLOBAL_LEADERBOARD_PAGE_SIZE,
  GLOBAL_LEADERBOARD_SLOTS_PER_SHOW,
  GLOBAL_LEADERBOARD_TOP_N,
  leaderboardPageWindow,
  computePickingAverage,
  computePointsPerShow,
  formatPickingAverage,
  formatPointsPerShow,
  mergeYouRow,
  rankBoard,
  viewerMetricsFromUserDoc,
} from './globalLeaderboardRanking';

describe('global leaderboard ratios (#1004)', () => {
  it('points per show is totalPoints / showsPlayed', () => {
    expect(computePointsPerShow(30, 3)).toBe(10);
    expect(computePointsPerShow(7, 2)).toBe(3.5);
    expect(computePointsPerShow(10, 0)).toBeNull();
  });

  it('picking average uses PROFILE_SLOTS_PER_SHOW = 6', () => {
    expect(GLOBAL_LEADERBOARD_SLOTS_PER_SHOW).toBe(6);
    expect(computePickingAverage(9, 3)).toBe(0.5);
    expect(formatPickingAverage(0.5)).toBe('.500');
    expect(formatPointsPerShow(10)).toBe('10');
    expect(formatPointsPerShow(3.5)).toBe('3.5');
  });
});

describe('rankBoard min-shows gate', () => {
  it('keeps default showsPlayed >= 3 on ratio boards so one-show spikes drop', () => {
    expect(GLOBAL_LEADERBOARD_MIN_SHOWS).toBe(3);
    const ranked = rankBoard([
      { uid: 'spike', handle: 'Spike', value: 40, shows: 1 },
      { uid: 'steady', handle: 'Steady', value: 12, shows: 4 },
      { uid: 'mid', handle: 'Mid', value: 11, shows: 3 },
    ]);
    expect(ranked.map((r) => r.uid)).toEqual(['steady', 'mid']);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
  });

  it('shows-count board has no ratio gate', () => {
    const ranked = rankBoard(
      [
        { uid: 'a', handle: 'A', value: 1, shows: 1 },
        { uid: 'b', handle: 'B', value: 12, shows: 12 },
      ],
      { minShows: 0 }
    );
    expect(ranked.map((r) => r.uid)).toEqual(['b', 'a']);
  });

  it('caps at top 50', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      uid: `u${i}`,
      handle: `H${String(i).padStart(2, '0')}`,
      value: 60 - i,
      shows: 5,
    }));
    expect(rankBoard(many)).toHaveLength(GLOBAL_LEADERBOARD_TOP_N);
  });
});

describe('mergeYouRow', () => {
  it('highlights the viewer when they are already in the top 50', () => {
    const merged = mergeYouRow(
      [
        { uid: 'a', handle: 'A', value: 12, shows: 4, rank: 1 },
        { uid: 'me', handle: 'Me', value: 10, shows: 5, rank: 2 },
      ],
      { uid: 'me', handle: 'Me', value: 10, shows: 5 }
    );
    expect(merged[1].isSelf).toBe(true);
    expect(merged[1].outsideTop).toBe(false);
    expect(merged).toHaveLength(2);
  });

  it('appends a you-row when the viewer sits outside the top 50', () => {
    const merged = mergeYouRow(
      [{ uid: 'a', handle: 'A', value: 12, shows: 4, rank: 1 }],
      { uid: 'me', handle: 'Me', value: 8, shows: 6 }
    );
    expect(merged).toHaveLength(2);
    expect(merged[1]).toMatchObject({
      uid: 'me',
      isSelf: true,
      outsideTop: true,
      rank: null,
      value: 8,
    });
  });
});

describe('viewerMetricsFromUserDoc', () => {
  const user = {
    handle: 'Pat',
    totalPoints: 40,
    showsPlayed: 4,
    careerCorrectSlots: 12,
    seasonStats: {
      '2026 Summer Tour': { totalPoints: 15, shows: 3, correctSlots: 6 },
    },
  };

  it('reads career fields for all-time boards', () => {
    const viewer = viewerMetricsFromUserDoc(user, {
      uid: 'u1',
      scope: 'allTime',
    });
    expect(viewer.values.pointsPerShow).toBe(10);
    expect(viewer.values.pickingAverage).toBe(0.5);
    expect(viewer.values.shows).toBe(4);
  });

  it('reads seasonStats.{tourKey} for this-tour boards', () => {
    const viewer = viewerMetricsFromUserDoc(user, {
      uid: 'u1',
      scope: 'tour',
      tourKey: '2026 Summer Tour',
    });
    expect(viewer.values.pointsPerShow).toBe(5);
    expect(viewer.values.pickingAverage).toBe(1 / 3);
    expect(viewer.values.shows).toBe(3);
  });
});

describe('leaderboardPageWindow', () => {
  it('pages the top 50 in tens and clamps a stale page', () => {
    expect(GLOBAL_LEADERBOARD_PAGE_SIZE).toBe(10);
    expect(leaderboardPageWindow(49, 0)).toEqual({
      current: 0,
      maxPage: 4,
      start: 0,
      end: 10,
    });
    expect(leaderboardPageWindow(49, 4)).toEqual({
      current: 4,
      maxPage: 4,
      start: 40,
      end: 49,
    });
    expect(leaderboardPageWindow(12, 9)).toEqual({
      current: 1,
      maxPage: 1,
      start: 10,
      end: 12,
    });
    expect(leaderboardPageWindow(8, 0).maxPage).toBe(0);
  });
});
