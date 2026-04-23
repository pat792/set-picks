import { ga4Event, ga4IsReady } from '../../../shared/lib/ga4';

const EVENT_NAME = 'profile_season_stats_computed';

/**
 * Proposed trigger threshold for auto-filing the follow-up materialization
 * ticket when live-compute becomes a cost concern. Values match the #220
 * acceptance criteria.
 */
export const PROFILE_STATS_TELEMETRY_THRESHOLDS = Object.freeze({
  /** Profile views per day (24h rolling) that should trigger materialize. */
  viewsPerDay: 50,
  /** p95 elapsed ms that should trigger materialize. */
  elapsedMsP95: 1500,
});

/**
 * Ship a single `profile_season_stats_computed` telemetry event for the
 * #220 observability work.
 *
 * Emits to GA4 when configured (SPA usage); always mirrors to `console.info`
 * in dev so the signal is visible while DevTools is open even without GA4
 * credentials. Failures inside GA never throw — telemetry must not break the
 * profile view.
 *
 * @param {{
 *   shows_checked: number,
 *   shows_played: number,
 *   collection_queries: number,
 *   elapsed_ms: number,
 *   self_view: boolean,
 * }} payload
 */
export function emitProfileSeasonStatsTelemetry(payload) {
  const params = {
    shows_checked: Number(payload.shows_checked) || 0,
    shows_played: Number(payload.shows_played) || 0,
    collection_queries: Number(payload.collection_queries) || 0,
    elapsed_ms: Math.max(0, Math.round(Number(payload.elapsed_ms) || 0)),
    self_view: Boolean(payload.self_view),
  };

  try {
    if (ga4IsReady()) {
      ga4Event(EVENT_NAME, params);
    }
  } catch (err) {
    console.warn('emitProfileSeasonStatsTelemetry: GA4 emit failed:', err);
  }

  if (import.meta.env.DEV) {
    console.info(`[telemetry] ${EVENT_NAME}`, params);
  }
}
