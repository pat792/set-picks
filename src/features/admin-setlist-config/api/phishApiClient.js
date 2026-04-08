/**
 * Raw HTTP client for external Phish setlist APIs (Phish.in, Phish.net).
 * No parsing beyond JSON — see #141. Parsing lives in `setlistParser` (#142).
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../../shared/lib/firebase.js';

/** @typedef {'NetworkError' | 'HTTPError' | 'JSONParseError' | 'SetlistApiError' | 'ConfigurationError'} SetlistFetchErrorType */

/**
 * @typedef {object} NetworkError
 * @property {'NetworkError'} type
 * @property {string} message
 * @property {unknown} [cause]
 */

/**
 * @typedef {object} HTTPError
 * @property {'HTTPError'} type
 * @property {string} message
 * @property {number} status
 * @property {string} [statusText]
 */

/**
 * @typedef {object} JSONParseError
 * @property {'JSONParseError'} type
 * @property {string} message
 * @property {unknown} [cause]
 */

/**
 * @typedef {object} SetlistApiError
 * @property {'SetlistApiError'} type
 * @property {string} message
 * @property {'phishnet'} source
 * @property {number} [code]
 */

/**
 * @typedef {object} ConfigurationError
 * @property {'ConfigurationError'} type
 * @property {string} message
 */

/** @typedef {NetworkError | HTTPError | JSONParseError | SetlistApiError | ConfigurationError} SetlistFetchError */

/**
 * @typedef {object} SetlistFetchSuccess
 * @property {true} ok
 * @property {unknown} data
 */

/**
 * @typedef {object} SetlistFetchFailure
 * @property {false} ok
 * @property {SetlistFetchError} error
 */

/** @typedef {SetlistFetchSuccess | SetlistFetchFailure} SetlistFetchResult */

const SHOW_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const PHISHIN_SHOW_URL = (date) => `https://phish.in/api/v2/shows/${encodeURIComponent(date)}`;

/** Phish.net v5 — see https://api.phish.net/ (setlists by showdate). */
const PHISHNET_SETLIST_URL = (date, apiKey) => {
  const base = `https://api.phish.net/v5/setlists/showdate/${encodeURIComponent(date)}.json`;
  if (!apiKey) return base;
  const q = new URLSearchParams({ apikey: apiKey });
  return `${base}?${q.toString()}`;
};

/** Keep in sync with `PHISHNET_FUNCTIONS_REGION` in `functions/index.js`. */
const PHISHNET_CALLABLE_REGION = 'us-central1';

function isPhishnetCallableEnabled() {
  const v = String(import.meta.env.VITE_USE_CALLABLE_PHISHNET_SETLIST ?? '')
    .trim()
    .toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

/**
 * @param {unknown} e
 * @returns {SetlistFetchError}
 */
function callableFailureToError(e) {
  const code = typeof e === 'object' && e !== null && 'code' in e ? String(e.code) : '';
  const msg =
    typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string'
      ? e.message
      : 'Callable request failed.';
  if (code === 'functions/unauthenticated') {
    return {
      type: 'ConfigurationError',
      message: 'Sign in required to fetch Phish.net setlist via server.',
    };
  }
  if (
    code === 'functions/permission-denied' ||
    code === 'functions/failed-precondition' ||
    code === 'functions/invalid-argument'
  ) {
    return { type: 'ConfigurationError', message: msg };
  }
  return { type: 'SetlistApiError', message: msg, source: 'phishnet' };
}

/**
 * @param {string} dateString
 * @returns {Promise<SetlistFetchResult>}
 */
async function fetchPhishnetViaCallable(dateString) {
  try {
    const functions = getFunctions(app, PHISHNET_CALLABLE_REGION);
    const getPhishnetSetlist = httpsCallable(functions, 'getPhishnetSetlist');
    const result = await getPhishnetSetlist({ showDate: dateString });
    const data = result.data;
    if (data == null || typeof data !== 'object') {
      return {
        ok: false,
        error: { type: 'JSONParseError', message: 'Empty or invalid response from server.' },
      };
    }
    const logical = phishNetLogicalError(data);
    if (logical) {
      return { ok: false, error: logical };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: callableFailureToError(e) };
  }
}

const ALLOWED_SOURCES = new Set(['phishin', 'phishnet']);

/**
 * @param {unknown} result
 * @returns {result is SetlistFetchFailure}
 */
export function isSetlistFetchFailure(result) {
  return Boolean(result && typeof result === 'object' && result.ok === false && 'error' in result);
}

/**
 * @param {string} dateString YYYY-MM-DD
 * @returns {ConfigurationError | null}
 */
function validateShowDate(dateString) {
  if (typeof dateString !== 'string' || !SHOW_DATE_RE.test(dateString)) {
    return {
      type: 'ConfigurationError',
      message: 'Expected show date in YYYY-MM-DD format.',
    };
  }
  return null;
}

/**
 * @returns {{ ok: true, source: 'phishin' | 'phishnet' } | { ok: false, error: ConfigurationError }}
 */
function resolveSource() {
  const raw = (import.meta.env.VITE_SETLIST_API_SOURCE ?? 'phishin').trim().toLowerCase();
  if (!ALLOWED_SOURCES.has(raw)) {
    return {
      ok: false,
      error: {
        type: 'ConfigurationError',
        message: `Invalid VITE_SETLIST_API_SOURCE "${raw}". Use phishin or phishnet.`,
      },
    };
  }
  return { ok: true, source: raw };
}

/** @param {unknown} cause */
function networkError(cause) {
  return /** @type {NetworkError} */ ({
    type: 'NetworkError',
    message: cause instanceof Error ? cause.message : 'Network request failed.',
    cause,
  });
}

/** @param {Response} res */
function httpErrorFromResponse(res) {
  return /** @type {HTTPError} */ ({
    type: 'HTTPError',
    message: `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''}`,
    status: res.status,
    statusText: res.statusText,
  });
}

/** @param {unknown} cause */
function jsonParseError(cause) {
  return /** @type {JSONParseError} */ ({
    type: 'JSONParseError',
    message: cause instanceof Error ? cause.message : 'Response was not valid JSON.',
    cause,
  });
}

/**
 * @param {unknown} body
 * @returns {SetlistApiError | null}
 */
function phishNetLogicalError(body) {
  if (!body || typeof body !== 'object') return null;
  const err = /** @type {Record<string, unknown>} */ (body).error;
  if (err === undefined || err === null || err === 0) return null;
  const msg =
    typeof /** @type {Record<string, unknown>} */ (body).error_message === 'string'
      ? /** @type {Record<string, unknown>} */ (body).error_message
      : 'Phish.net API returned an error.';
  const code = typeof err === 'number' ? err : undefined;
  return { type: 'SetlistApiError', message: msg, source: 'phishnet', code };
}

/**
 * @param {string} dateString
 * @returns {Promise<SetlistFetchResult>}
 */
async function fetchPhishinRaw(dateString) {
  const url = PHISHIN_SHOW_URL(dateString);
  let res;
  try {
    res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
  } catch (e) {
    return { ok: false, error: networkError(e) };
  }

  if (!res.ok) {
    return { ok: false, error: httpErrorFromResponse(res) };
  }

  try {
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: jsonParseError(e) };
  }
}

/**
 * @param {string} dateString
 * @returns {Promise<SetlistFetchResult>}
 */
async function fetchPhishnetRaw(dateString) {
  if (isPhishnetCallableEnabled()) {
    return fetchPhishnetViaCallable(dateString);
  }

  const apiKey = import.meta.env.VITE_PHISHNET_API_KEY ?? '';
  const url = PHISHNET_SETLIST_URL(dateString, apiKey);
  let res;
  try {
    res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
  } catch (e) {
    return { ok: false, error: networkError(e) };
  }

  if (!res.ok) {
    return { ok: false, error: httpErrorFromResponse(res) };
  }

  try {
    const data = await res.json();
    const logical = phishNetLogicalError(data);
    if (logical) {
      return { ok: false, error: logical };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: jsonParseError(e) };
  }
}

/**
 * Fetches raw setlist-related JSON for a show date from the configured external API.
 *
 * @param {string} dateString Show date `YYYY-MM-DD`
 * @returns {Promise<SetlistFetchResult>}
 */
export async function fetchSetlistRaw(dateString) {
  const badDate = validateShowDate(dateString);
  if (badDate) {
    return { ok: false, error: badDate };
  }

  const sourceRes = resolveSource();
  if (!sourceRes.ok) {
    return { ok: false, error: sourceRes.error };
  }

  if (sourceRes.source === 'phishnet') {
    return fetchPhishnetRaw(dateString);
  }
  return fetchPhishinRaw(dateString);
}
