"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_PICKS_LOCK_HM,
  lockHmFromDoors,
  resolvePicksLockHm,
} = require("./picksLockTime");

test("lockHmFromDoors uses doors+85 for Summer Tour 2026 defaults", () => {
  assert.deepEqual(lockHmFromDoors({ hour: 17, minute: 30 }), {
    hour: 18,
    minute: 55,
  });
});

test("resolvePicksLockHm seeds Merriweather and falls back", () => {
  assert.deepEqual(resolvePicksLockHm({ date: "2026-07-18" }), {
    hour: 18,
    minute: 55,
    source: "doors",
    doorsLocal: "17:30",
  });
  assert.deepEqual(resolvePicksLockHm({ date: "2099-01-01" }), {
    ...DEFAULT_PICKS_LOCK_HM,
    source: "fallback",
    doorsLocal: null,
  });
});
