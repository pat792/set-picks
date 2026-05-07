#!/usr/bin/env node
/**
 * Manual QA helper for push notifications:
 * send a canary push to a user's latest registered FCM token from terminal.
 *
 * Usage (from functions/):
 *   node scripts/sendPushCanaryForUser.js --uid=<firebase-uid> --apply
 *
 * Optional:
 *   --tokenDocId=<doc-id>  Send to a specific token doc id instead of latest.
 *   --project=<project-id> Override project id.
 *   --title="Custom title"
 *   --body="Custom body"
 *   --dry-run              Print target token doc only; do not send.
 */

const admin = require("firebase-admin");
const fs = require("node:fs");
const path = require("node:path");

const { normalizeFcmSendMessageId } = require("../fcmMessagingCore");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const ENV_PATH = path.join(REPO_ROOT, ".env");

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [k, ...rest] = arg.slice(2).split("=");
    out[k] = rest.length ? rest.join("=") : true;
  }
  return out;
}

function usageAndExit(message) {
  if (message) console.error(`\nError: ${message}\n`);
  console.log(
    [
      "Usage:",
      "  node scripts/sendPushCanaryForUser.js --uid=<firebase-uid> [--tokenDocId=<doc-id>] [--apply]",
      "",
      "Flags:",
      "  --dry-run   Default. Resolve token doc and print details only.",
      "  --apply     Actually send the push canary and write result metadata.",
      "",
      "Examples:",
      "  node scripts/sendPushCanaryForUser.js --uid=abc123 --apply",
      "  node scripts/sendPushCanaryForUser.js --uid=abc123 --tokenDocId=docid --apply",
      "",
      "Auth:",
      "  gcloud auth application-default login",
      "",
    ].join("\n")
  );
  process.exit(message ? 1 : 0);
}

function loadEnv() {
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

function timestampMs(value) {
  if (!value || typeof value !== "object") return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  return 0;
}

async function resolveTokenDoc({ db, uid, tokenDocId }) {
  const tokensRef = db.collection("users").doc(uid).collection("private_fcmTokens");
  if (tokenDocId) {
    const snap = await tokensRef.doc(tokenDocId).get();
    if (!snap.exists) {
      throw new Error(`Token doc not found: users/${uid}/private_fcmTokens/${tokenDocId}`);
    }
    return snap;
  }

  const snap = await tokensRef.get();
  if (snap.empty) {
    throw new Error(`No token docs found for users/${uid}/private_fcmTokens.`);
  }
  const sorted = [...snap.docs].sort((a, b) => {
    const aData = a.data() || {};
    const bData = b.data() || {};
    const aScore =
      timestampMs(aData.lastSeenAt) ||
      timestampMs(aData.createdAt) ||
      0;
    const bScore =
      timestampMs(bData.lastSeenAt) ||
      timestampMs(bData.createdAt) ||
      0;
    return bScore - aScore;
  });
  return sorted[0];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) usageAndExit();

  const uid = typeof args.uid === "string" ? args.uid.trim() : "";
  if (!uid) usageAndExit("--uid is required.");

  const tokenDocId =
    typeof args.tokenDocId === "string" ? args.tokenDocId.trim() : "";
  const apply = args.apply === true;
  const dryRun = !apply || args["dry-run"] === true;

  const fileEnv = loadEnv();
  const projectId =
    (typeof args.project === "string" && args.project.trim()) ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    fileEnv.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "Project id missing. Pass --project or set GOOGLE_CLOUD_PROJECT or VITE_FIREBASE_PROJECT_ID."
    );
  }

  const title =
    (typeof args.title === "string" && args.title.trim()) ||
    "Setlist Pick Em";
  const body =
    (typeof args.body === "string" && args.body.trim()) ||
    `Test notification delivered at ${new Date().toISOString()}`;

  admin.initializeApp({ projectId });
  const db = admin.firestore();

  const tokenDoc = await resolveTokenDoc({ db, uid, tokenDocId });
  const tokenData = tokenDoc.data() || {};
  const token = typeof tokenData.token === "string" ? tokenData.token.trim() : "";
  if (!token) {
    throw new Error(`Token doc ${tokenDoc.id} has no token field.`);
  }

  const tokenTail = token.slice(-12);
  console.log(
    [
      `Project: ${projectId}`,
      `User: ${uid}`,
      `Token doc: ${tokenDoc.id}`,
      `Token tail: ...${tokenTail}`,
      `Mode: ${dryRun ? "DRY RUN" : "APPLY"}`,
      "",
    ].join("\n")
  );

  if (dryRun) {
    console.log("Dry-run only. Re-run with --apply to send.");
    return;
  }

  const rawMessageId = await admin.messaging().send({
    token,
    notification: { title, body },
    data: {
      kind: "canary-script",
      sentAt: new Date().toISOString(),
      sentBy: process.env.USER || "unknown",
    },
    webpush: {
      fcmOptions: {
        link: "https://www.setlistpickem.com/dashboard/notifications",
      },
    },
  });
  const messageId = normalizeFcmSendMessageId(rawMessageId);

  await tokenDoc.ref.set(
    {
      lastCanaryAt: admin.firestore.FieldValue.serverTimestamp(),
      lastCanaryMessageId: messageId,
      lastCanaryBy: `script:${process.env.USER || "unknown"}`,
    },
    { merge: true }
  );

  console.log(`Sent canary. Message id: ${messageId}`);
}

main().catch((err) => {
  console.error("\nsendPushCanaryForUser.js failed:");
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
