import { ga4Event, ga4IsReady } from '../../../shared/lib/ga4';
import { PROFILE_STATS_TELEMETRY_THRESHOLDS } from './profileStatsTelemetry';

const EVENT_NAME = 'profile_pick_heatmap_computed';

/** Same materialize thresholds as season-stats (#220 / #553). */
export const PROFILE_PICK_HEATMAP_TELEMETRY_THRESHOLDS =
  PROFILE_STATS_TELEMETRY_THRESHOLDS;

/**
 * @param {{
 *   shows_checked: number,
 *   shows_played: number,
 *   collection_queries: number,
 *   setlist_reads?: number,
 *   elapsed_ms: number,
 *   self_view: boolean,
 *   cache_hit?: boolean,
 *   source?: 'live',
 * }} payload
 */
export function emitProfilePickHeatmapTelemetry(payload) {
  const params = {
    shows_checked: Number(payload.shows_checked) || 0,
    shows_played: Number(payload.shows_played) || 0,
    collection_queries: Number(payload.collection_queries) || 0,
    setlist_reads: Number(payload.setlist_reads) || 0,
    elapsed_ms: Math.max(0, Math.round(Number(payload.elapsed_ms) || 0)),
    self_view: Boolean(payload.self_view),
    cache_hit: Boolean(payload.cache_hit),
    source: 'live',
  };

  try {
    if (ga4IsReady()) {
      ga4Event(EVENT_NAME, params);
    }
  } catch (err) {
    console.warn('emitProfilePickHeatmapTelemetry: GA4 emit failed:', err);
  }

  if (import.meta.env.DEV) {
    console.info(`[telemetry] ${EVENT_NAME}`, params);
  }
}
