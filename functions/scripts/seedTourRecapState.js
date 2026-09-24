#!/usr/bin/env node
/**
 * Seed `comms_tour_recap_state` for tours that already had a one-time wrap
 * (or must stay archive-closed) so the 8am pending scanner hard-skips them.
 *
 * Usage (from repo root, with Application Default / Firebase admin creds):
 *   node functions/scripts/seedTourRecapState.js --dry-run
 *   node functions/scripts/seedTourRecapState.js --confirm
 *
 * Project id (required for --confirm):
 *   --project=set-picks
 *   or GOOGLE_CLOUD_PROJECT / GCLOUD_PROJECT
 *   or repo-root `.env` VITE_FIREBASE_PROJECT_ID
 *   or `.firebaserc` default
 */
"use strict";

const fs = require("node:fs");
const path = require("path");

const {
  TOUR_RECAP_STATE_COLLECTION,
  writeTourRecapState,
} = require("../tourRecapState");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const ENV_PATH = path.join(REPO_ROOT, ".env");
const FIREBASERC_PATH = path.join(REPO_ROOT, ".firebaserc");

function loadEnv() {
  /** @type {Record<string, string>} */
  const out = {};
  if (!fs.existsSync(ENV_PATH)) return out;
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function firebasercDefault() {
  try {
    const raw = JSON.parse(fs.readFileSync(FIREBASERC_PATH, "utf8"));
    return typeof raw?.projects?.default === "string" ? raw.projects.default : "";
  } catch {
    return "";
  }
}

function resolveProjectId(args) {
  const flag = args.find((a) => a.startsWith("--project="));
  if (flag) return flag.slice("--project=".length).trim();
  const fileEnv = loadEnv();
  return (
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT ||
    fileEnv.VITE_FIREBASE_PROJECT_ID ||
    firebasercDefault() ||
    ""
  );
}

/** @type {Array<{ tourKey: string, status: "sent" | "skipped_archive" | "closed", finalDate: string, source: string, note: string }>} */
const SEEDS = [
  {
    tourKey: "2026 Summer Tour",
    status: "sent",
    finalDate: "2026-09-06",
    source: "seed",
    note: "Manual live fan-out 2026-09-08 (32 cohort)",
  },
  {
    tourKey: "2026 Sphere",
    status: "skipped_archive",
    finalDate: "2026-05-02",
    source: "incident",
    note: "Archive edition; erroneous cron blast 2026-09-09 closed via state",
  },
];

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--confirm");
  if (!args.includes("--dry-run") && !args.includes("--confirm")) {
    console.error("Pass --dry-run or --confirm");
    process.exit(2);
  }

  // Lazy-load admin only when confirming so dry-run works without creds.
  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          collection: TOUR_RECAP_STATE_COLLECTION,
          seeds: SEEDS,
        },
        null,
        2
      )
    );
    return;
  }

  const projectId = resolveProjectId(args);
  if (!projectId) {
    console.error(
      "Project id missing. Pass --project=set-picks or set GOOGLE_CLOUD_PROJECT / VITE_FIREBASE_PROJECT_ID."
    );
    process.exit(2);
  }

  const admin = require("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
  }
  const db = admin.firestore();
  console.log(`seeding ${TOUR_RECAP_STATE_COLLECTION} on ${projectId}`);

  for (const seed of SEEDS) {
    // eslint-disable-next-line no-await-in-loop
    await writeTourRecapState({
      db,
      admin,
      tourKey: seed.tourKey,
      status: seed.status,
      finalDate: seed.finalDate,
      source: seed.source,
      extra: { note: seed.note },
    });
    console.log(`wrote ${seed.status}: ${seed.tourKey}`);
  }
  console.log("done", path.basename(__filename));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
