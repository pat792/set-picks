#!/usr/bin/env node
/**
 * CLI: deliver Summer Tour 2026 pre-opener marketing email (#468).
 *
 * Usage:
 *   node scripts/deliverMarketingSummerTour2026Launch.js              # dry run (default)
 *   node scripts/deliverMarketingSummerTour2026Launch.js --uid <uid>  # dry run one user (canary)
 *   node scripts/deliverMarketingSummerTour2026Launch.js --execute --uid <uid>  # send canary
 *   node scripts/deliverMarketingSummerTour2026Launch.js --execute    # send full cohort
 *
 * Requires Application Default Credentials with Firestore read access.
 * Execute mode also needs RESEND_API_KEY (and RESEND_WEBHOOK_SECRET for signed unsubscribe links).
 */

const admin = require("firebase-admin");
const {
  deliverMarketingSummerTour2026Launch,
} = require("../marketingBatchDelivery");

admin.initializeApp();
const db = admin.firestore();

const execute = process.argv.includes("--execute");
const forceResend = process.argv.includes("--force-resend");

/** @type {string[]} */
const onlyUids = [];
for (let i = 0; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === "--uid" && process.argv[i + 1]) {
    onlyUids.push(process.argv[i + 1]);
    i += 1;
  } else if (arg.startsWith("--uid=")) {
    onlyUids.push(arg.slice("--uid=".length));
  }
}

deliverMarketingSummerTour2026Launch({
  db,
  admin,
  dryRun: !execute,
  forceResend,
  onlyUids: onlyUids.length > 0 ? onlyUids : undefined,
  resendApiKey: process.env.RESEND_API_KEY,
  resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET,
  logger: console,
})
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
