#!/usr/bin/env node
/**
 * Validate `functions/commsDeployManifest.js` ↔ `functions/index.js` alignment.
 *
 *   npm run comms:deploy:validate
 *
 * Fails when a manifest export is missing from index.js or its secret binding
 * does not match `secretExpectation` (resend / webhook / none).
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const { flattenManifest } = require(path.join(root, "functions/commsDeployManifest.js"));

const indexSource = readFileSync(path.join(root, "functions/index.js"), "utf8");

/** @param {string} exportName */
function exportBlock(exportName) {
  const marker = `exports.${exportName}`;
  const start = indexSource.indexOf(marker);
  if (start === -1) return null;
  const next = indexSource.indexOf("\nexports.", start + marker.length);
  const end = next === -1 ? indexSource.length : next;
  return indexSource.slice(start, end);
}

/** @param {import('../functions/commsDeployManifest.js').ManifestEntry} entry */
function validateEntry(entry) {
  const block = exportBlock(entry.export);
  if (!block) {
    return `exports.${entry.export} not found in functions/index.js`;
  }
  const exp = entry.secretExpectation || "none";
  const hasResend = block.includes("resendApiKey");
  const hasWebhook = block.includes("resendWebhookSecret");
  if (exp === "resend" && !hasResend) {
    return `${entry.export}: expected secrets: [resendApiKey, …] in index.js`;
  }
  if (exp === "webhook" && !hasWebhook) {
    return `${entry.export}: expected resendWebhookSecret in index.js`;
  }
  if (exp === "none" && hasResend) {
    return `${entry.export}: secretExpectation is 'none' but index.js binds resendApiKey (update manifest or export)`;
  }
  return null;
}

const errors = [];
for (const entry of flattenManifest()) {
  const err = validateEntry(entry);
  if (err) errors.push(err);
}

if (errors.length) {
  console.error("❌ comms deploy manifest validation failed:\n");
  for (const e of errors) console.error(`  - ${e}`);
  console.error("\nFix functions/index.js and/or functions/commsDeployManifest.js");
  process.exit(1);
}

console.log(`✅ comms deploy manifest OK (${flattenManifest().length} exports)`);
