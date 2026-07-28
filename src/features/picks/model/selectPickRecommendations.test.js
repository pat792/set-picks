import { describe, expect, it } from 'vitest';

import { selectPickRecommendations } from './selectPickRecommendations.js';

describe('selectPickRecommendations', () => {
  it('rejects missing modelVersion / slots', () => {
    expect(selectPickRecommendations(null)).toBeNull();
    expect(
      selectPickRecommendations({
        targetShow: { date: '2024-07-19' },
        slots: {},
      }),
    ).toBeNull();
  });

  it('accepts a minimal valid artifact', () => {
    const body = {
      modelVersion: 'v0.1.0-explainable',
      targetShow: { date: '2024-07-19' },
      slots: { s1o: [] },
    };
    expect(selectPickRecommendations(body)).toEqual(body);
  });
});
