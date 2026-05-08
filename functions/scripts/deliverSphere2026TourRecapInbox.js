#!/usr/bin/env node
/**
 * CLI: deliver Sphere ’26 inaugural recap rows to `users/{uid}/commsInbox`
 * (same logic as `deliverSphere2026TourRecapInbox` callable).
 *
 * Usage:
 *   node scripts/deliverSphere2026TourRecapInbox.js           # dry run (default)
 *   node scripts/deliverSphere2026TourRecapInbox.js --execute # writes Firestore
 *
 * Requires Application Default Credentials with Firestore write access
 * (e.g. `gcloud auth application-default login` or service account).
 */

const admin = require("firebase-admin");
const {
  deliverSphere2026TourRecapInbox,
} = require("../sphereTourRecapDelivery");

admin.initializeApp();
const db = admin.firestore();

const execute = process.argv.includes("--execute");

deliverSphere2026TourRecapInbox({
  db,
  admin,
  dryRun: !execute,
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
