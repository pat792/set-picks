#!/usr/bin/env node
/**
 * Copy shared comms modules into `functions/comms/` for Firebase deploy.
 *
 * Firebase packages only the `functions/` directory; workers cannot require
 * `../comms/*` from the repo root at runtime in Cloud Run.
 *
 * Canonical source: `comms/*.cjs` at repo root (also used by Vite emails + api/).
 *
 *   npm run comms:sync
 */

import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const destDir = path.join(root, "functions/comms");

const FILES = ["emailBranding.cjs", "emailLinks.cjs", "email-gradient-wordmark.png"];

mkdirSync(destDir, { recursive: true });

for (const file of FILES) {
  const src = path.join(root, "comms", file);
  const dest = path.join(destDir, file);
  copyFileSync(src, dest);
  console.log(`Synced comms/${file} → functions/comms/${file}`);
}
