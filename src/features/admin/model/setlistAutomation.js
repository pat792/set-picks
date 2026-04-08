import {
  fetchSetlistRaw,
  isSetlistFetchFailure,
  mapParsedSetlistToLegacySaveShape,
  parseSetlist,
  SetlistParseError,
} from '../../admin-setlist-config/index.js';
import { FORM_FIELDS } from '../../../shared/data/gameConfig.js';

const gameConfig = { FORM_FIELDS };

/**
 * @param {{ type: string, message?: string, status?: number }} err
 * @returns {string}
 */
function formatSetlistFetchLayerError(err) {
  if (!err || typeof err !== 'object' || !('type' in err)) return 'Request failed.';
  switch (err.type) {
    case 'NetworkError':
      return err.message || 'Network error.';
    case 'HTTPError':
      return err.message || `HTTP ${err.status}`;
    case 'JSONParseError':
      return err.message || 'Invalid JSON in response.';
    case 'SetlistApiError':
      return err.message || 'Setlist API error.';
    case 'ConfigurationError':
      return err.message || 'Configuration error.';
    default:
      return 'Request failed.';
  }
}

/**
 * Fetches raw setlist JSON for a show date, parses it, and returns legacy shapes for the admin form.
 *
 * @param {string} showDate YYYY-MM-DD
 * @param {{ id: string }[]} slotFields Admin slot fields (typically `ADMIN_SETLIST_FIELDS`).
 * @returns {Promise<{ ok: true, setlistData: Record<string, string>, officialSetlist: string[] } | { ok: false, error: string }>}
 */
export async function fetchAndMapExternalSetlist(showDate, slotFields) {
  const rawResult = await fetchSetlistRaw(showDate);
  if (isSetlistFetchFailure(rawResult)) {
    return { ok: false, error: formatSetlistFetchLayerError(rawResult.error) };
  }

  const apiSource = import.meta.env.VITE_SETLIST_API_SOURCE ?? 'phishin';

  try {
    const parsed = parseSetlist(rawResult.data, apiSource, gameConfig);
    const { setlistData, officialSetlist } = mapParsedSetlistToLegacySaveShape(parsed, slotFields);
    return { ok: true, setlistData, officialSetlist };
  } catch (e) {
    if (e instanceof SetlistParseError) {
      return { ok: false, error: e.message };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to parse setlist.' };
  }
}
