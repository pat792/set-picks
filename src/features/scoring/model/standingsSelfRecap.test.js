import { describe, it, expect } from 'vitest';

import { computeStandingsSelfRecap } from './standingsSelfRecap';

describe('computeStandingsSelfRecap', () => {
  const setlist = [{ title: 'Song A' }];

  it('returns null when selfUserId or picks missing', () => {
    expect(computeStandingsSelfRecap([], setlist, 'u1')).toBeNull();
    expect(computeStandingsSelfRecap([{ userId: 'u1' }], setlist, null)).toBeNull();
  });

  it('uses natural rank and score when setlist exists', () => {
    const picks = [
      { userId: 'a', handle: 'Top', picks: {} },
      { userId: 'me', handle: 'Self', picks: {} },
    ];
    const r = computeStandingsSelfRecap(picks, setlist, 'me');
    expect(r?.displayRank).toBe(2);
    expect(r?.rankNumber).toBe(2);
    expect(r?.totalPlayers).toBe(2);
    expect(r?.handle).toBe('Self');
    expect(r?.selfAnchorId).toBe('standings-player-me');
  });

  it('hides numeric rank for self pre-grade (pinned row) but keeps rankNumber', () => {
    const picks = [
      { userId: 'a', handle: 'Other', picks: {} },
      { userId: 'me', handle: 'Self', picks: {} },
    ];
    const r = computeStandingsSelfRecap(picks, null, 'me');
    expect(r?.displayRank).toBeNull();
    expect(r?.rankNumber).toBe(1);
    expect(r?.totalScore).toBeNull();
  });
});
