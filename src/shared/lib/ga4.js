import ReactGA from 'react-ga4';

let initialized = false;

/** Dedupe StrictMode double-invoke and near-simultaneous duplicate sends. */
let lastPageSend = { path: '', t: 0 };
let lastEventSig = '';
let lastEventTime = 0;

/**
 * Hostnames where GA4 is allowed to initialize. Anything else (localhost,
 * Vercel preview deployments like *.vercel.app, custom staging domains)
 * stays GA-silent so analytics only reflects real production usage.
 */
const PROD_HOSTNAMES = new Set([
  'www.setlistpickem.com',
  'setlistpickem.com',
]);

/**
 * Read GA4 Measurement ID from the Vite env. Safe to call when unset (no-op).
 */
export function getGaMeasurementId() {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (id == null || String(id).trim() === '') return '';
  return String(id).trim();
}

function isProductionHost() {
  if (typeof window === 'undefined') return false;
  return PROD_HOSTNAMES.has(window.location.hostname);
}

/**
 * Initialize GA4 once when a Measurement ID is configured AND the build is
 * running on a production hostname. The hostname guard is defense-in-depth
 * against the GA Measurement ID leaking into preview/staging/local builds via
 * Vite env files — without it, every deploy with `VITE_GA_MEASUREMENT_ID` set
 * would phone home to prod analytics.
 */
export function initGa4() {
  if (initialized) return;
  if (!isProductionHost()) return;
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
