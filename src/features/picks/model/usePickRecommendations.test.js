import { describe, expect, it } from 'vitest';

import { PICK_RECOMMENDATIONS_CACHE_MAX_AGE_MS } from './pickRecommendationsConstants.js';
import { cachedPickRecommendationsAreCurrent } from './usePickRecommendations.js';

const now = Date.parse('2026-10-08T06:00:00.000Z');

function cached(date, ageMs = 60_000) {
  return {
    fetchedAt: now - ageMs,
    artifact: {
      modelVersion: 'v0.1.1-explainable',
      targetShow: { date },
      slots: { s1o: [] },
      playProbBySong: { ghost: 0.72 },
    },
  };
}

describe('cachedPickRecommendationsAreCurrent', () => {
  it('reuses a fresh file for the open night', () => {
    expect(cachedPickRecommendationsAreCurrent(cached('2026-10-09'), now, '2026-10-09')).toBe(
      true,
    );
  });

  it('refetches when the cached file is the previous show', () => {
    expect(cachedPickRecommendationsAreCurrent(cached('2026-10-07'), now, '2026-10-09')).toBe(
      false,
    );
  });

  it('keeps the TTL rule before a night is selected', () => {
    expect(cachedPickRecommendationsAreCurrent(cached('2026-10-07'), now, '')).toBe(true);
    expect(cachedPickRecommendationsAreCurrent(cached('2026-10-07'), now, null)).toBe(true);
  });

  it('drops a file once the TTL has passed', () => {
    const aged = cached('2026-10-09', PICK_RECOMMENDATIONS_CACHE_MAX_AGE_MS);
    expect(cachedPickRecommendationsAreCurrent(aged, now, '2026-10-09')).toBe(false);
  });

  it('rejects a cache entry that is not a recommendations artifact', () => {
    expect(
      cachedPickRecommendationsAreCurrent(
        { fetchedAt: now, artifact: { targetShow: { date: '2026-10-09' } } },
        now,
        '2026-10-09',
      ),
    ).toBe(false);
  });
});
