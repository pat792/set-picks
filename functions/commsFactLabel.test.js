"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildShowRecapFactLabel,
  buildTourRecapFactLabel,
  sanitizeFactLabel,
} = require("./commsFactLabel");

test("night label keeps one player slot and drops a flow id today's sentence does not speak", () => {
  const label = buildShowRecapFactLabel({
    branch: "mixed",
    card: "You hit the opener and closer (2 of 6); Bustout: Tweezer stayed off your board.",
    rankSentence: "You sit #18 of 80 globally.",
    showDate: "2026-10-07",
  });
  assert.deepEqual(label, {
    map: "show_recap",
    branch: "mixed",
    slots: ["named_slots", "night_rank"],
    showDate: "2026-10-07",
  });
});

test("night label omits showDate and rank when those facts are missing", () => {
  const label = buildShowRecapFactLabel({
    branch: "cold",
    card: "",
    rankSentence: "",
    showDate: "not-a-date",
  });
  assert.deepEqual(label, { map: "show_recap", branch: "cold", slots: [] });
});

test("tour champion label states rank, points, and nightly wins, not the flavor line", () => {
  const label = buildTourRecapFactLabel({
    rank: 1,
    points: 180,
    wins: 3,
    showsPlayed: 8,
    showCount: 8,
    tourId: "2026 Fall Tour",
    openingParas: ["Calling setlists is an inexact science on a good day."],
  });
  assert.deepEqual(label, {
    map: "tour_recap",
    branch: "champion",
    slots: ["rank", "points", "nightly_wins", "opening_fallback"],
    tourId: "2026 Fall Tour",
  });
});

test("sanitizeFactLabel drops an unknown map", () => {
  assert.equal(sanitizeFactLabel({ map: "picks_lock", branch: "cold", slots: ["none_hit"] }), null);
});
