#!/usr/bin/env node
/**
 * Targeted repair for a single CONSENT_ONLY user (May 2026 orphan bug).
 *
 * Pre-stamps `createdAt` on `users/{uid}` from
 * `Firebase Auth User.metadata.creationTime` so "Playing since" displays
 * the user's actual signup month rather than the day they complete setup.
 *
 * Optionally pre-fills `email` if the doc is missing it (consent-only
 * docs from the bug window lack the email field).
 *
 * This script does **not** create `handle` — that is the user's choice
 * and must come through `/setup`. Run this once for an identified orphan,
 * then nudge them to sign in and complete profile setup.
 *
 * Idempotent: refuses to overwrite an existing `createdAt`, refuses to
 * stomp an existing `handle`. Safe to re-run.
 *
 * Usage (from functions/):
 *   node scripts/repairConsentOnlyUser.js <uid>            # dry-run (default)
 *   node scripts/repairConsentOnlyUser.js <uid> --apply    # write to Firestore
 *
 * Optional:
 *   --project=<project-id>   Override project id
 *   --no-email-backfill      Skip writing the email field even if missing
 */

const admin = require("firebase-admin");

function parseArgs(argv) {
  const out = {
    uid: null,
    apply: false,
    emailBackfill: true,
    project: null,
  };
  for (const arg of argv) {
    if (arg === "--apply") out.apply = true;
    else if (arg === "--no-email-backfill") out.emailBackfill = false;
    else if (arg.startsWith("--project="))
      out.project = arg.slice("--project=".length);
    else if (!arg.startsWith("--") && !out.uid) out.uid = arg;
  }
  return out;
}

function usage(msg) {
  if (msg) console.error(`\nError: ${msg}\n`);
  console.log(
    [
      "Usage:",
      "  node scripts/repairConsentOnlyUser.js <uid> [--apply] [--no-email-backfill]",
      "",
      "Examples:",
      "  node scripts/repairConsentOnlyUser.js abc123              # dry-run",
      "  node scripts/repairConsentOnlyUser.js abc123 --apply      # write",
      "",
    ].join("\n")
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.uid) {
    usage("Missing <uid> argument.");
    process.exit(1);
  }

  admin.initializeApp(args.project ? { projectId: args.project } : {});

  const authUser = await admin.auth().getUser(args.uid);
  const docRef = admin.firestore().collection("users").doc(args.uid);
  const snap = await docRef.get();

  if (!snap.exists) {
    fail(
      "Firestore users doc does not exist for this uid.",
      "This is NO_DOC, not CONSENT_ONLY. Use a different remediation path."
    );
  }

  const data = snap.data() || {};
  if (data.handle) {
    fail(
      "User already has a handle — not in CONSENT_ONLY state.",
      `Current handle: ${JSON.stringify(data.handle)}. Aborting (no-op).`
    );
  }

  if (!data.termsPrivacyAcceptedAt) {
    fail(
      "Doc has neither handle nor termsPrivacyAcceptedAt — that's EMPTY_DOC, not CONSENT_ONLY.",
      "Investigate doc history before attempting repair."
    );
  }

  const patch = {};
  const reasoning = [];

  if (data.createdAt) {
    reasoning.push(
      `createdAt already present (${serializeTimestamp(
        data.createdAt
      )}); leaving as-is.`
    );
  } else if (!authUser.metadata.creationTime) {
    reasoning.push(
      "Auth.metadata.creationTime is missing; cannot backfill createdAt. Skipping."
    );
  } else {
    const ts = admin.firestore.Timestamp.fromDate(
      new Date(authUser.metadata.creationTime)
    );
    patch.createdAt = ts;
    reasoning.push(
      `Will set createdAt = ${authUser.metadata.creationTime} (from Auth.metadata.creationTime).`
    );
  }

  if (args.emailBackfill && !data.email && authUser.email) {
    patch.email = authUser.email;
    reasoning.push(`Will set email = ${authUser.email}.`);
  } else if (!args.emailBackfill) {
    reasoning.push("Email backfill skipped (--no-email-backfill).");
  } else if (data.email) {
    reasoning.push(`Email already present (${data.email}); leaving as-is.`);
  } else if (!authUser.email) {
    reasoning.push("Auth user has no email; nothing to backfill.");
  }

  console.log(
    JSON.stringify(
      {
        uid: args.uid,
        mode: args.apply ? "APPLY" : "DRY_RUN",
        existing: {
          handle: data.handle || null,
          email: data.email || null,
          createdAt: serializeTimestamp(data.createdAt),
          termsPrivacyAcceptedAt: serializeTimestamp(
            data.termsPrivacyAcceptedAt
          ),
        },
        patch,
        reasoning,
      },
      null,
      2
    )
  );

  if (Object.keys(patch).length === 0) {
    console.log("\nNothing to do.");
    return;
  }

  if (!args.apply) {
    console.log("\nDry-run complete. Re-run with --apply to write.");
    return;
  }

  await docRef.set(patch, { merge: true });
  console.log("\nPatch applied.");
}

function serializeTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate().toISOString();
  return null;
}

function fail(msg, hint) {
  console.error(`\n${msg}\n${hint}\n`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
