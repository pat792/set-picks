#!/usr/bin/env node
/**
 * Ops script for admin picks-lock override (#522).
 *
 * Runs the same pipeline as the deployed `lockPicksForShowNow` callable by
 * importing `applyLockPicksForShowNow` directly. Uses Application Default
 * Credentials — no Firebase Auth or callable round-trip.
 *
 * Usage (from `functions/`):
 *   node scripts/lockPicksForShowNow.js --showDate=2026-07-08
 *   node scripts/lockPicksForShowNow.js --showDate=2026-07-08 --lockedBy=pat@road2media.com
 *
 * Auth:
 *   gcloud auth application-default login
 *   ADC identity needs Firestore read/write on the project.
 *
 * Project id:
 *   Read from repo-root `.env` (`VITE_FIREBASE_PROJECT_ID`) or `GOOGLE_CLOUD_PROJECT`.
 */

const admin = require("firebase-admin");
const fs = require("node:fs");
const path = require("node:path");

const { applyLockPicksForShowNow } = require("../picksLockOverride");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const ENV_PATH = path.join(REPO_ROOT, ".env");

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
      "  node scripts/lockPicksForShowNow.js --showDate=YYYY-MM-DD [--lockedBy=email]",
      "",
      "Flags:",
      "  --showDate=...   Required. Show date to lock (YYYY-MM-DD).",
      "  --lockedBy=...   Optional. Email stamped on show_lock_state (audit only).",
      "",
      "Auth:  gcloud auth application-default login",
      "",
    ].join("\n"),
  );
  process.exit(msg ? 1 : 0);
}

/** @returns {Record<string, string>} */
function loadEnv() {
  /** @type {Record<string, string>} */
  const env = {};
  if (!fs.existsSync(ENV_PATH)) return env;
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
  const [y, m, d] = v.trim().split("-").map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return (
    parsed.getUTCFullYear() === y &&
    parsed.getUTCMonth() === m - 1 &&
    parsed.getUTCDate() === d
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) usageAndExit();

  const showDate =
    typeof args.showDate === "string" ? args.showDate.trim() : "";
  if (!isShowDate(showDate)) {
    usageAndExit("Pass --showDate=YYYY-MM-DD.");
  }

  const lockedBy =
    typeof args.lockedBy === "string" && args.lockedBy.trim()
      ? args.lockedBy.trim()
      : null;

  const fileEnv = loadEnv();
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT || fileEnv.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "Project id missing: set GOOGLE_CLOUD_PROJECT or VITE_FIREBASE_PROJECT_ID in .env",
    );
  }

  admin.initializeApp({ projectId });
  const db = admin.firestore();

  console.log(`Locking picks for ${showDate} on project ${projectId}…`);
  const result = await applyLockPicksForShowNow({
    db,
    admin,
    showDate,
    lockedBy,
    logger: console,
  });

  if (result.alreadyLocked) {
    console.log(`Already locked for ${showDate} (admin_override).`);
  } else {
    console.log(`Locked picks for ${showDate}.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
