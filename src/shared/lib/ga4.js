import ReactGA from 'react-ga4';

let initialized = false;

/** Dedupe StrictMode double-invoke and near-simultaneous duplicate sends. */
let lastPageSend = { path: '', t: 0 };
let lastEventSig = '';
let lastEventTime = 0;

/**
 * Read GA4 Measurement ID from the Vite env. Safe to call when unset (no-op).
 */
export function getGaMeasurementId() {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (id == null || String(id).trim() === '') return '';
  return String(id).trim();
}

/**
 * Initialize GA4 once when a Measurement ID is configured.
 */
export function initGa4() {
  if (initialized) return;
  const id = getGaMeasurementId();
  if (!id) return;
  ReactGA.initialize(id);
  initialized = true;
}

export function ga4IsReady() {
  return initialized;
}

/**
 * SPA virtual pageview (path should include query when it affects content).
 */
export function ga4SendPageView(page) {
  if (!initialized || !page) return;
  const now = Date.now();
  if (lastPageSend.path === page && now - lastPageSend.t < 120) return;
  lastPageSend = { path: page, t: now };
  ReactGA.send({ hitType: 'pageview', page });
}

/**
 * GA4 event (recommended or custom). No-op when GA is not initialized.
 * Suppresses duplicate name+params within a short window (React StrictMode in dev).
 */
export function ga4Event(name, params = {}) {
  if (!initialized || !name) return;
  const now = Date.now();
  const sig = `${name}:${JSON.stringify(params)}`;
  if (lastEventSig === sig && now - lastEventTime < 120) return;
  lastEventSig = sig;
  lastEventTime = now;
  ReactGA.event(name, params);
}
