#!/usr/bin/env node
/**
 * Publish a GitHub Release from the current package.json version.
 *
 * Requires explicit opt-in:
 *   npm run release:publish -- --confirm
 *
 * Steps: release-gate → git tag vX.Y.Z → push tag → gh release create
 *
 * Agents MUST only run this when the user explicitly requests a release/tag.
 */

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const pkg = require(path.join(root, "package.json"));

const args = process.argv.slice(2);
if (!args.includes("--confirm")) {
  console.error("Refusing to publish without --confirm");
  console.error("Usage: npm run release:publish -- --confirm [--verify] [--title \"…\"] [--notes-file path]");
  process.exit(1);
}

const runVerify = args.includes("--verify");
const titleIdx = args.indexOf("--title");
const notesFileIdx = args.indexOf("--notes-file");
const customTitle = titleIdx >= 0 ? args[titleIdx + 1] : null;
const notesFile = notesFileIdx >= 0 ? args[notesFileIdx + 1] : null;

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: false, cwd: root, ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function extractChangelogSection(version) {
  const cl = readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  const header = `## [${version}]`;
  const start = cl.indexOf(header);
  if (start === -1) return null;
  const afterHeader = cl.indexOf("\n", start);
  const next = cl.indexOf("\n## [", afterHeader + 1);
  return cl.slice(afterHeader + 1, next === -1 ? cl.length : next).trim();
}

const version = pkg.version;
const tag = `v${version}`;

console.log(`Publishing release ${tag}…\n`);

run("node", ["scripts/release-gate.mjs", ...(runVerify ? ["--verify"] : [])]);

const gateNotes = extractChangelogSection(version);
const notes =
  notesFile != null
    ? readFileSync(path.resolve(root, notesFile), "utf8")
    : gateNotes || `Release ${version}`;

const title = customTitle || `v${version}`;

run("git", ["tag", tag, "-m", `Release ${version}`]);
run("git", ["push", "origin", tag]);

const ghArgs = ["release", "create", tag, "--title", title, "--latest", "--notes", notes];
run("gh", ghArgs);

console.log(`\n✅ Published ${tag}`);
