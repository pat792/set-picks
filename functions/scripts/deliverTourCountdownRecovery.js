#!/usr/bin/env node
/**
 * CLI: manual recovery send for `tour_countdown` (e.g. missed T-1 after #514).
 *
 * Usage:
 *   node functions/scripts/deliverTourCountdownRecovery.js
 *     # dry run — Summer Tour T-1 from showDatesByTour
 *   node functions/scripts/deliverTourCountdownRecovery.js --uid <uid>
 *     # dry run one user (canary)
 *   node functions/scripts/deliverTourCountdownRecovery.js --execute --uid <uid>
 *     # send canary (all channels)
 *   node functions/scripts/deliverTourCountdownRecovery.js --execute
 *     # send full cohort
 *   node functions/scripts/deliverTourCountdownRecovery.js --tour "Summer Tour 2026" --days 1
 *
 * Requires Application Default Credentials (or GCP_CLIENT_EMAIL / GCP_PRIVATE_KEY in .env).
 * Execute mode needs RESEND_API_KEY (+ RESEND_WEBHOOK_SECRET for unsubscribe links).
 */

const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const admin = require("firebase-admin");
const { deliverTourCountdownRecovery } = require("../tourCountdownRecoveryDelivery");

const PROJECT_ID = "set-picks";

/** @type {Record<string, string>} */
const envVars = {};
try {
  const envPath = resolve(__dirname, "../../.env");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) envVars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
} catch {
  // .env optional when ADC is configured
}

if (!admin.apps.length) {
  const clientEmail = envVars.GCP_CLIENT_EMAIL;
  const privateKey = envVars.GCP_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: PROJECT_ID,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      projectId: PROJECT_ID,
    });
  } else {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
}
const db = admin.firestore();

const execute = process.argv.includes("--execute");
const forceResend = process.argv.includes("--force-resend");

/** @type {string[]} */
const onlyUids = [];
let tourName;
let daysRemaining = 1;

for (let i = 0; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === "--uid" && process.argv[i + 1]) {
    onlyUids.push(process.argv[i + 1]);
    i += 1;
  } else if (arg.startsWith("--uid=")) {
    onlyUids.push(arg.slice("--uid=".length));
  } else if (arg === "--tour" && process.argv[i + 1]) {
    tourName = process.argv[i + 1];
    i += 1;
  } else if (arg.startsWith("--tour=")) {
    tourName = arg.slice("--tour=".length);
  } else if (arg === "--days" && process.argv[i + 1]) {
    daysRemaining = Number(process.argv[i + 1]);
    i += 1;
  } else if (arg.startsWith("--days=")) {
    daysRemaining = Number(arg.slice("--days=".length));
  }
}

if (!Number.isFinite(daysRemaining) || daysRemaining < 0) {
  console.error("--days must be a non-negative number");
  process.exit(1);
}

deliverTourCountdownRecovery({
  db,
  admin,
  dryRun: !execute,
  forceResend,
  onlyUids: onlyUids.length > 0 ? onlyUids : undefined,
  tourName,
  daysRemaining,
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
