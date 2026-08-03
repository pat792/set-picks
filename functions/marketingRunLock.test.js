"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { claimMarketingRun, finishMarketingRun } = require("./marketingRunLock");

function makeFakeDb() {
  /** @type {Map<string, Record<string, unknown>>} */
  const docs = new Map();
  const admin = {
    firestore: {
      FieldValue: {
        serverTimestamp: () => ({ _ts: true }),
      },
    },
  };

  const db = {
    collection: (name) => ({
      doc: (id) => {
        const key = `${name}/${id}`;
        return {
          id,
          async get() {
            const data = docs.get(key);
            return {
              exists: Boolean(data),
              data: () => (data ? { ...data } : undefined),
            };
          },
          async set(data, opts) {
            const prev = docs.get(key) || {};
            docs.set(key, opts?.merge ? { ...prev, ...data } : { ...data });
          },
        };
      },
    }),
    async runTransaction(fn) {
      const tx = {
        async get(ref) {
          return ref.get();
        },
        set(ref, data, opts) {
          return ref.set(data, opts);
        },
      };
      return fn(tx);
    },
    _docs: docs,
  };

  return { db, admin };
}

test("claimMarketingRun creates running when missing", async () => {
  const { db, admin } = makeFakeDb();
  const claim = await claimMarketingRun(db, admin, "summer_2026_almost_end", {
    targetDate: "2026-08-03",
  });
  assert.equal(claim.claimed, true);
  assert.equal(
    db._docs.get("comms_marketing_runs/summer_2026_almost_end").status,
    "running"
  );
});

test("claimMarketingRun skips completed status", async () => {
  const { db, admin } = makeFakeDb();
  await db.collection("comms_marketing_runs").doc("summer_2026_almost_end").set({
    status: "completed",
    targetDate: "2026-08-03",
  });
  const claim = await claimMarketingRun(db, admin, "summer_2026_almost_end", {
    targetDate: "2026-08-03",
  });
  assert.equal(claim.claimed, false);
  assert.equal(claim.reason, "completed");
});

test("claimMarketingRun skips cancelled", async () => {
  const { db, admin } = makeFakeDb();
  await db.collection("comms_marketing_runs").doc("summer_2026_almost_end").set({
    status: "cancelled",
  });
  const claim = await claimMarketingRun(db, admin, "summer_2026_almost_end");
  assert.equal(claim.claimed, false);
  assert.equal(claim.reason, "cancelled");
});

test("finishMarketingRun marks completed", async () => {
  const { db, admin } = makeFakeDb();
  await finishMarketingRun(db, admin, "summer_2026_almost_end", "completed", {
    ok: true,
  });
  assert.equal(
    db._docs.get("comms_marketing_runs/summer_2026_almost_end").status,
    "completed"
  );
});
