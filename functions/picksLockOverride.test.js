const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isAdminPicksLockOverrideDoc,
  applyLockPicksForShowNow,
} = require("./picksLockOverride");

test("isAdminPicksLockOverrideDoc: true for admin_override with picksLockedAt", () => {
  assert.equal(
    isAdminPicksLockOverrideDoc({
      lockReason: "admin_override",
      picksLockedAt: { _seconds: 1 },
    }),
    true
  );
});

test("isAdminPicksLockOverrideDoc: false for missing doc or other reasons", () => {
  assert.equal(isAdminPicksLockOverrideDoc(null), false);
  assert.equal(isAdminPicksLockOverrideDoc({ lockReason: "admin_override" }), false);
  assert.equal(
    isAdminPicksLockOverrideDoc({ lockReason: "setlist_poll", picksLockedAt: {} }),
    false
  );
});

test("applyLockPicksForShowNow: writes lock doc on first call", async () => {
  const store = new Map();
  const db = {
    collection: () => ({
      doc: (id) => ({
        get: async () => ({
          exists: store.has(id),
          data: () => store.get(id),
        }),
        set: async (payload, opts) => {
          const prev = store.get(id) || {};
          store.set(id, opts?.merge ? { ...prev, ...payload } : payload);
        },
      }),
    }),
  };
  const admin = {
    firestore: {
      FieldValue: {
        serverTimestamp: () => ({ __serverTimestamp: true }),
      },
    },
  };

  const result = await applyLockPicksForShowNow({
    db,
    admin,
    showDate: "2026-07-07",
    lockedBy: "admin@example.com",
  });

  assert.equal(result.ok, true);
  assert.equal(result.alreadyLocked, false);
  assert.equal(store.get("2026-07-07").lockReason, "admin_override");
  assert.equal(store.get("2026-07-07").lockedBy, "admin@example.com");
});

test("applyLockPicksForShowNow: idempotent when already locked", async () => {
  const store = new Map([
    [
      "2026-07-07",
      {
        showDate: "2026-07-07",
        lockReason: "admin_override",
        picksLockedAt: { _seconds: 99 },
        lockedBy: "admin@example.com",
      },
    ],
  ]);
  let writeCount = 0;
  const db = {
    collection: () => ({
      doc: (id) => ({
        get: async () => ({
          exists: store.has(id),
          data: () => store.get(id),
        }),
        set: async () => {
          writeCount += 1;
        },
      }),
    }),
  };
  const admin = {
    firestore: {
      FieldValue: {
        serverTimestamp: () => ({ __serverTimestamp: true }),
      },
    },
  };

  const result = await applyLockPicksForShowNow({
    db,
    admin,
    showDate: "2026-07-07",
    lockedBy: "other@example.com",
  });

  assert.equal(result.alreadyLocked, true);
  assert.equal(writeCount, 0);
});
