#!/usr/bin/env node
/**
 * Admin-script wrapper for the `backfillBustoutsForShows` callable (#214).
 *
 * Mints a short-lived admin-claim ID token via firebase-admin + Identity
 * Toolkit REST, then POSTs to the deployed callable. Keeps the entire
 * backfill pipeline (Phish.net fetch → derive bustouts → write snapshot →
 * recompute pick scores → reconcile `users.totalPoints` for graded picks) in
 * the single deployed source of truth — this script is only a caller.
 *
 * Usage (from repo root or functions/):
 *   # Dry-run: list which shows are missing `bustouts` on `official_setlists`.
 *   cd functions
 *   node scripts/backfillBustouts.js --missing --dry-run
 *
 *   # Backfill every show missing a snapshot:
 *   node scripts/backfillBustouts.js --missing --apply
 *
 *   # Backfill specific show dates:
 *   node scripts/backfillBustouts.js --showDates=2025-12-28,2025-12-30 --apply
 *
 * Auth:
 *   Requires Application Default Credentials (ADC) for `firebase-admin`:
 *     gcloud auth application-default login
 *   The script mints a custom token with `{ admin: true }` for a synthetic
 *   UID (`backfill-bustouts-script`) — no real user account is created; the
 *   token is discarded after the call. The deployed callable gates on the
 *   `admin` claim via `assertAdminClaim` (functions/adminAuth.js).
 *
 * Config read from repo-root `.env`:
 *   VITE_FIREBASE_API_KEY   — required, used for custom→ID token exchange.
 *   VITE_FIREBASE_PROJECT_ID — used to derive the callable URL.
 *
 * This script is safe to re-run: the callable is idempotent (write-merge;
 * score-delta reconciliation is zero when bustouts didn't change).
 */

const admin = require("firebase-admin");
const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const ENV_PATH = path.join(REPO_ROOT, ".env");
const BACKFILL_UID = "backfill-bustouts-script";
const FUNCTIONS_REGION = "us-central1";

/**
 * @param {string[]} argv
 * @returns {Record<string, string | true>}
 */
function parseArgs(argv) {
  /** @type {Record<string, string | true>} */
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [k, ...rest] = arg.slice(2).split("=");
    out[k] = rest.length ? rest.join("=") : true;
  }
  return out;
}

function usageAndExit(msg) {
  if (msg) console.error(`\nError: ${msg}\n`);
  console.log(
    [
      "Usage:",
      "  node scripts/backfillBustouts.js --missing [--dry-run|--apply]",
      "  node scripts/backfillBustouts.js --showDates=YYYY-MM-DD[,YYYY-MM-DD...] [--dry-run|--apply]",
      "",
      "Modes:",
      "  --missing           Scan official_setlists for docs without a `bustouts` field.",
      "  --showDates=...     Comma-separated list of show dates to backfill.",
      "",
      "Flags:",
      "  --dry-run           Default. List target show dates; do not call the callable.",
      "  --apply             Invoke the deployed backfillBustoutsForShows callable.",
      "",
      "Auth:",
      "  Requires ADC: gcloud auth application-default login",
      "",
    ].join("\n"),
  );
  process.exit(msg ? 1 : 0);
}

/** @returns {Record<string, string>} */
function loadEnv() {
  /** @type {Record<string, string>} */
  const env = {};
  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(`.env not found at ${ENV_PATH}`);
  }
  const text = fs.readFileSync(ENV_PATH, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    env[k] = v;
  }
  return env;
}

function isShowDate(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return false;
  // Reject impossible calendar dates (e.g. 2025-13-99). Parse as UTC to avoid
  // local-timezone rollover flipping a valid boundary date.
  const [y, m, d] = v.trim().split("-").map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return (
    parsed.getUTCFullYear() === y &&
    parsed.getUTCMonth() === m - 1 &&
    parsed.getUTCDate() === d
  );
}

/**
 * Exchange a custom token for a Firebase ID token using the Identity Toolkit
 * REST API. The resulting ID token carries the developer claims set on the
 * custom token (`admin: true`), which `assertAdminClaim` checks on the server.
 *
 * @param {string} customToken
 * @param {string} apiKey - Firebase web API key (VITE_FIREBASE_API_KEY).
 * @returns {Promise<string>}
 */
async function exchangeCustomTokenForIdToken(customToken, apiKey) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(
    apiKey,
  )}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      body?.error?.message || `HTTP ${res.status} ${res.statusText || ""}`.trim();
    throw new Error(`signInWithCustomToken failed: ${msg}`);
  }
  if (!body?.idToken) {
    throw new Error("signInWithCustomToken response missing idToken.");
  }
  return body.idToken;
}

/**
 * POST to the deployed callable HTTPS endpoint with the Firebase ID token.
 *
 * @param {string} projectId
 * @param {string} idToken
 * @param {object} data - The `data` payload the callable expects.
 * @returns {Promise<unknown>} The `result` field from the callable response.
 */
async function invokeCallable(projectId, idToken, data) {
  const url = `https://${FUNCTIONS_REGION}-${projectId}.cloudfunctions.net/backfillBustoutsForShows`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ data }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      body?.error?.message ||
      body?.error?.status ||
      `HTTP ${res.status} ${res.statusText || ""}`.trim();
    throw new Error(`backfillBustoutsForShows callable failed: ${msg}`);
  }
  return body.result;
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @returns {Promise<string[]>}
 */
async function scanMissing(db) {
  const snap = await db.collection("official_setlists").get();
  /** @type {string[]} */
  const missing = [];
  for (const d of snap.docs) {
    const data = d.data() || {};
    if (!Array.isArray(data.bustouts)) missing.push(d.id);
  }
  missing.sort();
  return missing;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) usageAndExit();

  const useMissing = args.missing === true;
  const showDatesArg =
    typeof args.showDates === "string" ? args.showDates.trim() : "";
  if (!useMissing && !showDatesArg) {
    usageAndExit("Pass either --missing or --showDates=...");
  }
  if (useMissing && showDatesArg) {
    usageAndExit("Pass only one of --missing or --showDates=... (not both).");
  }

  const apply = args.apply === true;
  const dryRun = !apply || args["dry-run"] === true;

  // --- Env + admin init ---
  const env = loadEnv();
  const apiKey = env.VITE_FIREBASE_API_KEY;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  if (!apiKey) throw new Error("VITE_FIREBASE_API_KEY missing from .env");
  if (!projectId) throw new Error("VITE_FIREBASE_PROJECT_ID missing from .env");

  admin.initializeApp({ projectId });
  const db = admin.firestore();

  // --- Resolve target show dates ---
  /** @type {string[]} */
  let showDates = [];
  if (useMissing) {
    console.log("Scanning official_setlists for docs missing `bustouts`...");
    showDates = await scanMissing(db);
    if (showDates.length === 0) {
      console.log("No shows missing bustouts. Nothing to do.");
      return;
    }
  } else {
    showDates = showDatesArg
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const d of showDates) {
      if (!isShowDate(d)) usageAndExit(`Invalid date in --showDates: ${d}`);
    }
  }

  console.log(
    [
      "",
      `Target show dates: ${showDates.length}`,
      ...showDates.map((d) => `  - ${d}`),
      `Mode: ${dryRun ? "DRY RUN (no callable invocation)" : "APPLY"}`,
      "",
    ].join("\n"),
  );

  if (dryRun) {
    console.log("Dry-run complete. Re-run with --apply to invoke the callable.");
    return;
  }

  // --- Mint admin-claim token ---
  console.log("Minting admin-claim token for backfill script...");
  const customToken = await admin
    .auth()
    .createCustomToken(BACKFILL_UID, { admin: true });
  const idToken = await exchangeCustomTokenForIdToken(customToken, apiKey);

  // --- Invoke the deployed callable (single source of truth) ---
  console.log(
    `Invoking backfillBustoutsForShows (${FUNCTIONS_REGION}) for ${showDates.length} show(s)...`,
  );
  const started = Date.now();
  const result = await invokeCallable(projectId, idToken, { showDates });
  const elapsedMs = Date.now() - started;

  console.log(`\nCallable returned in ${elapsedMs}ms:\n`);
  console.log(JSON.stringify(result, null, 2));

  // --- Summary ---
  const results =
    result && typeof result === "object" && Array.isArray(result.results)
      ? result.results
      : [];
  let totalPicksUpdated = 0;
  let totalReconciled = 0;
  let skipped = 0;
  for (const row of results) {
    if (row.skipped) {
      skipped += 1;
      continue;
    }
    if (typeof row.updatedPicks === "number") totalPicksUpdated += row.updatedPicks;
    if (typeof row.reconciledGradedPicks === "number")
      totalReconciled += row.reconciledGradedPicks;
  }
  console.log(
    [
      "",
      "Summary:",
      `  shows processed         : ${results.length - skipped}`,
      `  shows skipped           : ${skipped}`,
      `  pick scores recomputed  : ${totalPicksUpdated}`,
      `  graded picks reconciled : ${totalReconciled}`,
      "",
    ].join("\n"),
  );
}

main().catch((err) => {
  console.error("\nbackfillBustouts.js failed:");
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
