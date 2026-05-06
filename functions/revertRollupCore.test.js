"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { applyRevertRollupForShow } = require("./revertRollupCore");

test("applyRevertRollupForShow: refuses when rollup_audit is missing", async () => {
  const auditGet = async () => ({ exists: false });
  const db = {
    collection(name) {
      if (name === "rollup_audit") {
        return {
          doc: () => ({ get: auditGet }),
        };
      }
      throw new Error(`unexpected collection ${name}`);
    },
  };
  const admin = { firestore: { FieldValue: {} } };
  const result = await applyRevertRollupForShow({
    db,
    admin,
    showDate: "2026-04-30",
    callerUid: "u1",
  });
  assert.equal(result.ok, false);
  assert.ok(result.message && result.message.includes("rollup_audit"));
});
