#!/usr/bin/env node
/**
 * Seed `comms_tour_recap_state` for tours that already had a one-time wrap
 * (or must stay archive-closed) so the 8am pending scanner hard-skips them.
 *
 * Usage (from repo root, with Application Default / Firebase admin creds):
 *   node functions/scripts/seedTourRecapState.js --dry-run
 *   node functions/scripts/seedTourRecapState.js --confirm
 */
"use strict";

const path = require("path");

const {
  TOUR_RECAP_STATE_COLLECTION,
  writeTourRecapState,
} = require("../tourRecapState");

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

  const admin = require("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  const db = admin.firestore();

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
