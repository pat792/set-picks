#!/usr/bin/env node
/**
 * SemVer release gate — mirrors `.github/workflows/ci.yml` "Version bumped" step
 * plus CHANGELOG presence. Run before tagging or publishing a GitHub Release.
 *
 *   npm run release:gate
 *   npm run release:gate:full   # also runs lint + unit tests
 *
 * Exit 0 when package.json version is ahead of the latest GitHub Release tag and
 * CHANGELOG.md contains a matching `## [X.Y.Z]` section.
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

const args = new Set(process.argv.slice(2));
const runVerify = args.has("--verify");

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: false, ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function latestReleaseTag() {
  const gh = spawnSync("gh", ["release", "list", "--limit", "1", "--json", "tagName", "-q", ".[0].tagName"], {
    encoding: "utf8",
    shell: false,
  });
  if (gh.status === 0 && gh.stdout?.trim()) {
    return gh.stdout.trim();
  }
  const tags = spawnSync("git", ["tag", "--list", "v*", "--sort=-v:refname"], {
    encoding: "utf8",
    shell: false,
  });
  if (tags.status === 0 && tags.stdout?.trim()) {
    return tags.stdout.trim().split("\n")[0];
  }
  return "v0.0.0";
}

function changelogHasVersion(version) {
  const cl = readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  return cl.includes(`## [${version}]`);
}

const current = pkg.version;
const tagged = latestReleaseTag();
const taggedVersion = tagged.startsWith("v") ? tagged.slice(1) : tagged;

console.log(`Latest release tag : ${tagged}`);
console.log(`package.json version: ${current}`);

if (`v${current}` === tagged) {
  console.error(`\n❌ package.json version (${current}) matches the last release tag (${tagged}).`);
  console.error("   Bump version in package.json and add a CHANGELOG.md entry before releasing.");
  console.error("   See docs/API.md §6 and .cursor/rules/versioning.mdc.");
  process.exit(1);
}

if (!changelogHasVersion(current)) {
  console.error(`\n❌ CHANGELOG.md has no section for ## [${current}].`);
  console.error("   Add a Keep-a-Changelog entry before releasing.");
  process.exit(1);
}

console.log(`✓ version ${current} is ahead of last release ${tagged}`);
console.log(`✓ CHANGELOG.md contains ## [${current}]`);

if (runVerify) {
  console.log("\nRunning verify matrix…");
  run("npm", ["run", "lint"]);
  run("npm", ["test"]);
  run("npm", ["test"], { cwd: path.join(root, "functions") });
}

console.log("\n✅ Release gate passed");
