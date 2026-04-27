import { ga4Event, ga4IsReady } from '../../../shared/lib/ga4';

const EVENT_NAME = 'pool_standings_computed';

/**
 * Ship a single `pool_standings_computed` GA4 event per pool-standings
 * view. Mirrors `profile_season_stats_computed` (#220 / #244 / #243):
 *
 *   - `cache_hit` distinguishes a real load from a React Query cache hit.
 *   - `source` is `'materialized' | 'live' | 'mixed'` —
 *     `'materialized'` when every member resolved via the #244 user-doc
 *     snapshot, `'live'` when every member fell back, `'mixed'` when at
 *     least one of each was needed.
 *   - `member_count`, `members_materialized`, `members_live_fallback`
 *     report the per-load read mix so we can confirm the
 *     `≤ N + O(1)` Firestore-reads invariant in production.
 *   - `scope` = `'all-time' | 'tour'`.
 *
 * Failures inside GA never throw — telemetry must never break the
 * standings view.
 *
 * @param {{
 *   member_count: number,
 *   members_materialized: number,
 *   members_live_fallback: number,
 *   elapsed_ms: number,
 *   scope: 'all-time' | 'tour',
 *   cache_hit: boolean,
 * }} payload
 */
export function emitPoolStandingsTelemetry(payload) {
  const memberCount = Number(payload.member_count) || 0;
  const materialized = Number(payload.members_materialized) || 0;
  const live = Number(payload.members_live_fallback) || 0;
  const cacheHit = Boolean(payload.cache_hit);
  const source = resolvePoolStandingsSource({ materialized, live, cacheHit });

  const params = {
    member_count: memberCount,
    members_materialized: cacheHit ? 0 : materialized,
    members_live_fallback: cacheHit ? 0 : live,
    elapsed_ms: Math.max(0, Math.round(Number(payload.elapsed_ms) || 0)),
    scope: payload.scope === 'tour' ? 'tour' : 'all-time',
    cache_hit: cacheHit,
    source,
  };

  try {
    if (ga4IsReady()) {
      ga4Event(EVENT_NAME, params);
    }
  } catch (err) {
    console.warn('emitPoolStandingsTelemetry: GA4 emit failed:', err);
  }

  if (import.meta.env.DEV) {
    console.info(`[telemetry] ${EVENT_NAME}`, params);
  }
}

/**
 * Pure source-resolution rule extracted so we can unit-test the
 * `mixed` / `materialized` / `live` decision table without touching GA4.
 *
 * @param {{ materialized: number, live: number, cacheHit: boolean }} input
 * @returns {'materialized' | 'live' | 'mixed'}
 */
export function resolvePoolStandingsSource({ materialized, live, cacheHit }) {
  if (cacheHit) return 'materialized';
  if (live === 0 && materialized > 0) return 'materialized';
  if (materialized === 0 && live > 0) return 'live';
  if (materialized > 0 && live > 0) return 'mixed';
  return 'materialized';
}
