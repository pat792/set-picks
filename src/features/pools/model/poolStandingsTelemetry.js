import { ga4Event, ga4IsReady } from '../../../shared/lib/ga4';

const EVENT_NAME = 'pool_standings_computed';

/**
 * Ship a single `pool_standings_computed` GA4 event per pool-standings
 * view. Lighter shape than the original #254 emit because pool standings
 * no longer use the materialized read path (per-pool aggregation is the
 * pre-#254 live compute — see `loadPoolStandings`):
 *
 *   - `cache_hit` distinguishes a real compute from a React Query cache
 *     hit (#243). Cache hits zero out `shows_scanned` / `elapsed_ms`.
 *   - `member_count` × `shows_scanned` is the per-load Firestore read
 *     count so we can monitor read-cost trends and quantify the future
 *     pool-aggregate materialization win.
 *   - `scope` = `'all-time' | 'tour'`.
 *
 * GA failures never throw — telemetry must never break the standings
 * view.
 *
 * @param {{
 *   member_count: number,
 *   shows_scanned: number,
 *   elapsed_ms: number,
 *   scope: 'all-time' | 'tour',
 *   cache_hit: boolean,
 * }} payload
 */
export function emitPoolStandingsTelemetry(payload) {
  const memberCount = Number(payload.member_count) || 0;
  const showsScanned = Number(payload.shows_scanned) || 0;
  const cacheHit = Boolean(payload.cache_hit);

  const params = {
    member_count: memberCount,
    shows_scanned: cacheHit ? 0 : showsScanned,
    elapsed_ms: cacheHit
      ? 0
      : Math.max(0, Math.round(Number(payload.elapsed_ms) || 0)),
    scope: payload.scope === 'tour' ? 'tour' : 'all-time',
    cache_hit: cacheHit,
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
