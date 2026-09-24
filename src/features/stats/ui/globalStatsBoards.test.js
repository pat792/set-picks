import { describe, expect, it } from 'vitest';

import {
  GLOBAL_LEADERBOARD_BOARDS,
  GLOBAL_LEADERBOARD_MIN_SHOWS,
  GLOBAL_LEADERBOARD_PAGE_SIZE,
} from '../model/globalLeaderboardRanking';

describe('Global Stats boards (#1004 Phase 2)', () => {
  it('ships the locked v1 metric set only', () => {
    expect(GLOBAL_LEADERBOARD_BOARDS.map((b) => b.title)).toEqual([
      'Points per show',
      'Picking average',
      'Shows',
    ]);
    expect(GLOBAL_LEADERBOARD_MIN_SHOWS).toBe(3);
    expect(GLOBAL_LEADERBOARD_PAGE_SIZE).toBe(10);
    const copy = GLOBAL_LEADERBOARD_BOARDS.map((b) => b.hint).join(' ');
    expect(copy).not.toMatch(/vintage|Bustout|most played|#300|#694/i);
  });
});
