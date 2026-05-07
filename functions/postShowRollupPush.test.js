"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  dedupeWinOverNearMiss,
  CLOSE_CALL_MAX_GAP,
} = require("./postShowRollupPush");

test("dedupeWinOverNearMiss drops nearMiss when the same user also won", () => {
  const hints = [
    { kind: "nearMiss", userId: "a", pickId: "p1" },
    { kind: "win", userId: "a", pickId: "p2" },
    { kind: "nearMiss", userId: "b", pickId: "p3" },
  ];
  const out = dedupeWinOverNearMiss(hints);
  assert.equal(out.length, 2);
  assert.ok(out.some((h) => h.kind === "win" && h.userId === "a"));
  assert.ok(out.some((h) => h.kind === "nearMiss" && h.userId === "b"));
});

test("CLOSE_CALL_MAX_GAP stays aligned with issue #275", () => {
  assert.equal(CLOSE_CALL_MAX_GAP, 2);
});
