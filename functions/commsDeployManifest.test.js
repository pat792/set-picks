"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  COMMS_DEPLOY_GROUPS,
  GROUP_ORDER,
  flattenManifest,
  listExportNames,
  buildFirebaseDeployOnlyArg,
} = require("./commsDeployManifest");

const indexSource = fs.readFileSync(path.join(__dirname, "index.js"), "utf8");

test("manifest export names are unique", () => {
  const names = flattenManifest().map((e) => e.export);
  assert.equal(names.length, new Set(names).size, `duplicate exports: ${names}`);
});

test("every manifest export is declared in index.js", () => {
  for (const entry of flattenManifest()) {
    assert.match(
      indexSource,
      new RegExp(`exports\\.${entry.export}\\s*=`),
      `missing exports.${entry.export} in index.js — add export or remove from commsDeployManifest.js`
    );
  }
});

test("listExportNames matches group counts", () => {
  const all = listExportNames("all");
  assert.equal(all.length, flattenManifest().length);
  assert.equal(listExportNames("eventAdapters").length, COMMS_DEPLOY_GROUPS.eventAdapters.length);
});

test("buildFirebaseDeployOnlyArg includes every export in group", () => {
  const arg = buildFirebaseDeployOnlyArg("eventAdapters");
  for (const name of listExportNames("eventAdapters")) {
    assert.ok(arg.includes(`functions:${name}`), arg);
  }
});

test("GROUP_ORDER covers all manifest keys", () => {
  for (const key of Object.keys(COMMS_DEPLOY_GROUPS)) {
    assert.ok(GROUP_ORDER.includes(key), `GROUP_ORDER missing ${key}`);
  }
});
