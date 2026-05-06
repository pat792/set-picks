const test = require("node:test");
const assert = require("node:assert/strict");

const {
  evaluateManualFinalizeTimingGate,
  getShowStatus,
} = require("./showFinalizationGate");

const CAL = [
  { date: "2026-04-28", timeZone: "America/New_York" },
  { date: "2026-04-29", timeZone: "America/New_York" },
  { date: "2026-04-30", timeZone: "America/New_York" },
  { date: "2026-05-01", timeZone: "America/New_York" },
];

test("getShowStatus: date before local today is PAST", () => {
  const now = new Date("2026-05-06T18:00:00.000Z");
  assert.equal(getShowStatus("2026-04-30", CAL, now), "PAST");
});

test("evaluateManualFinalizeTimingGate: allows PAST without force", () => {
  const now = new Date("2026-05-06T18:00:00.000Z");
  const g = evaluateManualFinalizeTimingGate({
    showDate: "2026-04-30",
    calendarShows: CAL,
    autoFinalizedAt: null,
    force: false,
    now,
  });
  assert.equal(g.allowed, true);
  assert.equal(g.reason, "past");
  assert.equal(g.showStatus, "PAST");
});

test("evaluateManualFinalizeTimingGate: blocks LIVE without force", () => {
  // 8:10pm Eastern on the show date — after 7:55pm picks lock (#303).
  const now = new Date("2026-04-30T20:10:00-04:00");
  const st = getShowStatus("2026-04-30", CAL, now);
  assert.equal(st, "LIVE");
  const g = evaluateManualFinalizeTimingGate({
    showDate: "2026-04-30",
    calendarShows: CAL,
    autoFinalizedAt: null,
    force: false,
    now,
  });
  assert.equal(g.allowed, false);
  assert.equal(g.reason, "show-not-past");
  assert.ok(g.message && g.message.includes("LIVE"));
});

test("evaluateManualFinalizeTimingGate: allows when autoFinalizedAt set", () => {
  const now = new Date("2026-04-30T23:00:00.000Z");
  const g = evaluateManualFinalizeTimingGate({
    showDate: "2026-04-30",
    calendarShows: CAL,
    autoFinalizedAt: { _seconds: 1, _nanoseconds: 0 },
    force: false,
    now,
  });
  assert.equal(g.allowed, true);
  assert.equal(g.reason, "auto-finalized");
});

test("evaluateManualFinalizeTimingGate: force bypasses LIVE", () => {
  const now = new Date("2026-04-30T23:00:00.000Z");
  const g = evaluateManualFinalizeTimingGate({
    showDate: "2026-04-30",
    calendarShows: CAL,
    autoFinalizedAt: null,
    force: true,
    now,
  });
  assert.equal(g.allowed, true);
  assert.equal(g.reason, "force-early");
});

test("evaluateManualFinalizeTimingGate: no calendar blocks without force", () => {
  const g = evaluateManualFinalizeTimingGate({
    showDate: "2026-04-30",
    calendarShows: null,
    autoFinalizedAt: null,
    force: false,
    now: new Date(),
  });
  assert.equal(g.allowed, false);
  assert.equal(g.reason, "no-calendar");
});
