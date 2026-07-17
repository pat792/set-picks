import { describe, expect, it } from 'vitest';

import { PROFILE_BADGES, resolveEarnedBadges } from './badgeCatalog';

describe('badgeCatalog', () => {
  it('includes v1 participation + win badges', () => {
    const ids = PROFILE_BADGES.map((b) => b.id);
    expect(ids).toEqual([
      'shows_played_1',
      'shows_played_5',
      'shows_played_10',
      'win_1',
    ]);
  });

  it('resolves earned badges sorted by tier then name', () => {
    const earned = resolveEarnedBadges({
      shows_played_1: { awardedAt: null, scope: 'career' },
      win_1: { awardedAt: null, scope: 'career' },
      unknown_badge: { awardedAt: null },
    });
    expect(earned.map((b) => b.id)).toEqual(['win_1', 'shows_played_1']);
    expect(earned[0].name).toBe('First Night Win');
  });

  it('returns empty for missing map', () => {
    expect(resolveEarnedBadges(null)).toEqual([]);
    expect(resolveEarnedBadges(undefined)).toEqual([]);
  });
});
