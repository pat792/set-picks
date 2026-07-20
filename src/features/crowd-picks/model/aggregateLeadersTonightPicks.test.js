import { describe, expect, it } from 'vitest';

import { aggregateLeadersTonightPicks } from './aggregateLeadersTonightPicks';

describe('aggregateLeadersTonightPicks (#692)', () => {
  const leaders = [
    { uid: 'u1', handle: 'Alpha', totalPoints: 100 },
    { uid: 'u2', handle: 'Beta', totalPoints: 90 },
    { uid: 'u3', handle: 'Gamma', totalPoints: 80 },
    { uid: 'u4', handle: 'Delta', totalPoints: 70 },
    { uid: 'u5', handle: 'Epsilon', totalPoints: 60 },
    { uid: 'u6', handle: 'Zeta', totalPoints: 50 },
  ];

  const tonight = [
    {
      userId: 'u1',
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
      userId: 'u2',
      picks: {
        s1o: 'Tweezer',
        s1c: 'Sample',
        s2o: 'Ghost',
        s2c: 'YEM',
        enc: 'Tube',
        wild: 'Gin',
      },
    },
    {
      userId: 'u3',
      picks: {
        s1o: 'Disease',
        s1c: 'Antelope',
        s2o: 'Piper',
        s2c: 'Slave',
        enc: 'Bug',
        wild: 'NICU',
      },
    },
  ];

  it('uses top 5 and reports locked-in fraction', () => {
    const out = aggregateLeadersTonightPicks(leaders, tonight);
    expect(out.topK).toBe(5);
    expect(out.leaders).toHaveLength(5);
    expect(out.leaders.map((l) => l.uid)).not.toContain('u6');
    expect(out.lockedIn).toBe(3);
    expect(out.lockedInLabel).toBe('3/5');
    const tweezer = out.songs.find((s) => s.title === 'Tweezer');
    expect(tweezer?.cardCount).toBe(2);
    expect(tweezer?.amongLeaders).toEqual(['Alpha', 'Beta']);
  });
});
