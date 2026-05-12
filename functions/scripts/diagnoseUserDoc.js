#!/usr/bin/env node
/**
 * Read-only diagnostic for a single Firebase Auth UID.
 *
 * Classifies the user against the May 2026 consent-only orphan bug
 * (PR #399). Output is JSON to stdout so it can be piped into jq / log
 * aggregation. Designed to run via Application Default Credentials —
 * no service-account key required if you've already done
 * `gcloud auth application-default login` against the prod project.
 *
 * Usage (from functions/):
 *   node scripts/diagnoseUserDoc.js <uid>
 *
 * Optional:
 *   --project=<project-id>  Override project id (defaults to the ADC project).
 *
 * Classifications:
 *   HEALTHY        — `handle` set; doc is in expected end state.
 *   CONSENT_ONLY   — doc has `termsPrivacyAcceptedAt` but no `handle`.
 *                    Standard PR #393 → PR #399 bug victim. Self-repairs
 *                    when they next visit `/setup`, provided PR-2 has
 *                    shipped so `createdAt` gets stamped from
 *                    `auth.metadata.creationTime`.
 *   NO_DOC         — Auth account exists, Firestore doc does not.
 *                    Worst case: no consent record at all (compliance
 *                    gap). Likely sign-in modal Google new-user, or
 *                    failed-rollback phantom.
 *   EMPTY_DOC      — doc exists but is missing both `handle` AND
 *                    `termsPrivacyAcceptedAt`. Unexpected; investigate.
 */

const admin = require("firebase-admin");

function parseArgs(argv) {
  const out = { uid: null };
  for (const arg of argv) {
    if (arg.startsWith("--project=")) {
      out.project = arg.slice("--project=".length);
    } else if (!arg.startsWith("--") && !out.uid) {
      out.uid = arg;
    }
  }
  return out;
}

function usage(msg) {
  if (msg) console.error(`\nError: ${msg}\n`);
  console.log(
    [
      "Usage:",
      "  node scripts/diagnoseUserDoc.js <uid> [--project=<project-id>]",
      "",
      "Example:",
      "  node scripts/diagnoseUserDoc.js Mwq6GiLB9OSF29eMmQjlTWOKJRz1",
      "",
    ].join("\n")
  );
}

function classify(authUser, docData) {
  if (!docData) return "NO_DOC";
  if (docData.handle) return "HEALTHY";
  if (docData.termsPrivacyAcceptedAt) return "CONSENT_ONLY";
  return "EMPTY_DOC";
}

function serializeTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate().toISOString();
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.uid) {
    usage("Missing <uid> argument.");
    process.exit(1);
  }

  const initOpts = args.project ? { projectId: args.project } : {};
  admin.initializeApp(initOpts);

  let authUser;
  try {
    authUser = await admin.auth().getUser(args.uid);
  } catch (err) {
    console.log(
      JSON.stringify(
        {
          uid: args.uid,
          classification: "AUTH_LOOKUP_FAILED",
          error: { code: err.code, message: err.message },
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const docRef = admin.firestore().collection("users").doc(args.uid);
  const docSnap = await docRef.get();
  const docData = docSnap.exists ? docSnap.data() || null : null;

  const classification = classify(authUser, docData);

  const summary = {
    uid: args.uid,
    classification,
    auth: {
      email: authUser.email || null,
      emailVerified: authUser.emailVerified,
      providers: authUser.providerData.map((p) => p.providerId),
      creationTime: authUser.metadata.creationTime || null,
      lastSignInTime: authUser.metadata.lastSignInTime || null,
    },
    doc: docData
      ? {
          hasHandle: Boolean(docData.handle),
          hasConsent: Boolean(docData.termsPrivacyAcceptedAt),
          hasCreatedAt: Boolean(docData.createdAt),
          hasEmail: Boolean(docData.email),
          handle: docData.handle || null,
          createdAt: serializeTimestamp(docData.createdAt),
          termsPrivacyAcceptedAt: serializeTimestamp(
            docData.termsPrivacyAcceptedAt
          ),
          totalPoints:
            typeof docData.totalPoints === "number"
              ? docData.totalPoints
              : null,
        }
      : null,
    suggestedAction: suggestedAction(classification),
  };

  console.log(JSON.stringify(summary, null, 2));
}

function suggestedAction(classification) {
  switch (classification) {
    case "HEALTHY":
      return "No repair needed.";
    case "CONSENT_ONLY":
      return [
        "User can self-repair by visiting /setup (now correctly enforced).",
        "If you want to pre-stamp createdAt (so 'Playing since' shows their",
        "real signup month), run:",
        "  node scripts/repairConsentOnlyUser.js <uid> --apply",
      ].join("\n");
    case "NO_DOC":
      return [
        "Worst case — Auth user exists but no Firestore doc at all.",
        "Likely sign-in-modal Google new-user (PR-3 closes this hole) or",
        "a phantom from a failed rollback. Options:",
        "  - Delete the Auth account if user never engaged.",
        "  - Reach out to capture consent + handle, then have them sign in",
        "    again to hit /setup.",
      ].join("\n");
    case "EMPTY_DOC":
      return "Unexpected state — investigate doc history in Firestore console.";
    default:
      return "Unknown classification.";
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
