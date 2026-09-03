import { describe, expect, it } from 'vitest';

import {
  computeScorecardOverlap,
  formatOverlapLabel,
} from './computeScorecardOverlap';

const self = {
  s1o: 'Tweezer',
  s1c: 'You Enjoy Myself',
  s2o: 'Ghost',
  s2c: '',
  enc: 'Tweeprise',
  wild: '46 Days',
};

describe('computeScorecardOverlap', () => {
  it('counts other players with the same song in the same slot', () => {
    const picks = [
      { userId: 'me', picks: self },
      { userId: 'a', picks: { s1o: 'Tweezer', s1c: 'YEM' } },
      { uid: 'b', picks: { s1o: 'tweezer', wild: '46  Days' } },
      { userId: 'c', s1o: 'Wolfman\'s Brother' },
    ];

    const rows = computeScorecardOverlap(picks, 'me', self);
    const byId = Object.fromEntries(rows.map((r) => [r.fieldId, r]));

    expect(byId.s1o.alsoPickedCount).toBe(2);
    expect(byId.s1c.alsoPickedCount).toBe(0);
    expect(byId.wild.alsoPickedCount).toBe(1);
    expect(byId.s2c.alsoPickedCount).toBe(0);
    expect(byId.s2c.song).toBe('');
  });

  it('excludes the signed-in user and ignores missing arrays', () => {
    expect(computeScorecardOverlap(null, 'me', self).every((r) => r.alsoPickedCount === 0)).toBe(
      true,
    );
    const onlySelf = computeScorecardOverlap([{ userId: 'me', picks: self }], 'me', self);
    expect(onlySelf.find((r) => r.fieldId === 's1o')?.alsoPickedCount).toBe(0);
  });

  it('does not count the same song in a different slot', () => {
    const picks = [{ userId: 'a', picks: { s1c: 'Tweezer' } }];
    const rows = computeScorecardOverlap(picks, 'me', { s1o: 'Tweezer' });
    expect(rows.find((r) => r.fieldId === 's1o')?.alsoPickedCount).toBe(0);
  });
});

describe('formatOverlapLabel', () => {
  it('uses singular / plural / empty copy', () => {
    expect(formatOverlapLabel(0)).toBe('Nobody else picked this');
    expect(formatOverlapLabel(1)).toBe('1 player also picked this');
    expect(formatOverlapLabel(12)).toBe('12 players also picked this');
  });
});
