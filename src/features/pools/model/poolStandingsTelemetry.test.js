import { describe, expect, it } from 'vitest';

import { resolvePoolStandingsSource } from './poolStandingsTelemetry';

/**
 * Source-resolution decision table for the `pool_standings_computed`
 * GA4 event. Pure so the truth table is locked in test, separate from
 * GA4 emit plumbing.
 */
describe('resolvePoolStandingsSource', () => {
  it('returns "materialized" for a React Query cache hit regardless of counts', () => {
    expect(
      resolvePoolStandingsSource({ materialized: 0, live: 0, cacheHit: true })
    ).toBe('materialized');
    expect(
      resolvePoolStandingsSource({ materialized: 4, live: 2, cacheHit: true })
    ).toBe('materialized');
  });

  it('returns "materialized" when every member resolved via the user doc', () => {
    expect(
      resolvePoolStandingsSource({ materialized: 5, live: 0, cacheHit: false })
    ).toBe('materialized');
  });

  it('returns "live" when every member fell back to live-compute', () => {
    expect(
      resolvePoolStandingsSource({ materialized: 0, live: 3, cacheHit: false })
    ).toBe('live');
  });

  it('returns "mixed" when at least one member used each path', () => {
    expect(
      resolvePoolStandingsSource({ materialized: 4, live: 1, cacheHit: false })
    ).toBe('mixed');
  });

  it('falls back to "materialized" for the empty-pool no-op case (defensive)', () => {
    expect(
      resolvePoolStandingsSource({ materialized: 0, live: 0, cacheHit: false })
    ).toBe('materialized');
  });
});
