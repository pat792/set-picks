#!/usr/bin/env node
/**
 * Deploy comms Cloud Functions using the canonical manifest (`functions/commsDeployManifest.js`).
 *
 *   npm run comms:deploy:list
 *   npm run comms:deploy:dry
 *   npm run comms:deploy -- --group eventAdapters
 *   npm run comms:deploy -- --confirm
 *
 * Groups (dynamic — driven by manifest, not hardcoded counts):
 *   eventAdapters | hookHosts | infra | all (default)
 *
 * When adding adapter #7, #8, … append one row to commsDeployManifest.js only.
 */

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const {
  COMMS_DEPLOY_GROUPS,
  GROUP_ORDER,
  listExportNames,
  buildFirebaseDeployOnlyArg,
} = require(path.join(root, "functions/commsDeployManifest.js"));

const args = process.argv.slice(2);
const project = args.includes("--project")
  ? args[args.indexOf("--project") + 1]
  : process.env.FIREBASE_PROJECT || "set-picks";

function parseGroup() {
  const idx = args.indexOf("--group");
  if (idx === -1) return "all";
  const value = args[idx + 1];
  if (value === "all") return "all";
  if (GROUP_ORDER.includes(value)) return value;
  console.error(`Unknown --group ${value}. Valid: all, ${GROUP_ORDER.join(", ")}`);
  process.exit(1);
}

function runValidate() {
  const r = spawnSync("node", ["scripts/comms-deploy-validate.mjs"], {
    cwd: root,
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function printList(groupKey) {
  const keys = groupKey === "all" ? GROUP_ORDER : [groupKey];
  console.log("Comms deploy manifest\n");
  for (const key of keys) {
    const rows = COMMS_DEPLOY_GROUPS[key] || [];
    console.log(`## ${key} (${rows.length})`);
    for (const row of rows) {
      const meta = row.triggerId || row.commsPath || row.note || "";
      const gate = row.gated ? " [COMMS_EVENT_ADAPTERS_ENABLED]" : "";
      const secret = row.secretExpectation ? ` secret=${row.secretExpectation}` : "";
      console.log(`  - ${row.export}${gate}${secret}${meta ? ` — ${meta}` : ""}`);
    }
    console.log("");
  }
  const names = listExportNames(groupKey);
  console.log(`Total exports: ${names.length}`);
  console.log(`firebase deploy --only ${buildFirebaseDeployOnlyArg(groupKey)} --project ${project}`);
}

const groupKey = parseGroup();
const listOnly = args.includes("--list");
const dryRun = args.includes("--dry-run");
const deploy = args.includes("--confirm");

if (listOnly || (!dryRun && !deploy)) {
  printList(groupKey);
  if (!listOnly && !deploy) {
    console.log("\nPass --dry-run to print the deploy command, or --confirm to deploy.");
  }
  process.exit(0);
}

runValidate();

const onlyArg = buildFirebaseDeployOnlyArg(groupKey);
const cmd = ["deploy", "--only", onlyArg, "--project", project];

console.log(`\nfirebase ${cmd.join(" ")}\n`);

if (dryRun) {
  process.exit(0);
}

if (!deploy) {
  console.error("Refusing to deploy without --confirm");
  process.exit(1);
}

const r = spawnSync("firebase", cmd, { cwd: root, stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);

console.log("\n✅ Comms functions deploy complete");
console.log("Post-deploy: verify secrets with:");
console.log(
  "  gcloud functions describe <export> --gen2 --region=us-central1 --project=set-picks --format='value(serviceConfig.secretEnvironmentVariables.key)'"
);
