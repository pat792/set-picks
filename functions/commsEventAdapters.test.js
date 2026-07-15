"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  shouldDeliverAccountWelcome,
  shouldDeliverPicksConfirmed,
  computeGlobalRankByUid,
  findTourCountdownTargets,
  loadUserIdsWithPicksForShowDates,
  leaderUidFromScores,
} = require("./commsEventAdapters");
const { isCommsEventAdaptersEnabled } = require("./commsAdapterRuntime");

test("isCommsEventAdaptersEnabled defaults false", () => {
  const prev = process.env.COMMS_EVENT_ADAPTERS_ENABLED;
  delete process.env.COMMS_EVENT_ADAPTERS_ENABLED;
  assert.equal(isCommsEventAdaptersEnabled(), false);
  process.env.COMMS_EVENT_ADAPTERS_ENABLED = "true";
  assert.equal(isCommsEventAdaptersEnabled(), true);
  if (prev === undefined) delete process.env.COMMS_EVENT_ADAPTERS_ENABLED;
  else process.env.COMMS_EVENT_ADAPTERS_ENABLED = prev;
});

test("shouldDeliverAccountWelcome when handle first appears", () => {
  assert.equal(shouldDeliverAccountWelcome(null, { handle: "phish" }), true);
  assert.equal(shouldDeliverAccountWelcome({ handle: "phish" }, { handle: "phish" }), false);
  assert.equal(shouldDeliverAccountWelcome({ termsPrivacyAcceptedAt: "x" }, { handle: "" }), false);
});

test("shouldDeliverPicksConfirmed on first non-empty pick write", () => {
  assert.equal(
    shouldDeliverPicksConfirmed(false, null, {
      userId: "u1",
      picks: { opener: "Tweezer" },
    }),
    true
  );
  assert.equal(
    shouldDeliverPicksConfirmed(true, { picks: {} }, { picks: { opener: "Tweezer" } }),
    false
  );
});

test("computeGlobalRankByUid ranks by score with ties", () => {
  const docs = [
    { id: "a", data: () => ({ userId: "u1", picks: { opener: "x" } }) },
    { id: "b", data: () => ({ userId: "u2", picks: { opener: "y" } }) },
    { id: "c", data: () => ({ userId: "u3", picks: { opener: "z" } }) },
  ];
  const scores = new Map([
    ["a", 10],
    ["b", 10],
    ["c", 5],
  ]);
  const ranks = computeGlobalRankByUid(docs, scores);
  assert.equal(ranks.get("u1")?.rank, 1);
  assert.equal(ranks.get("u2")?.rank, 1);
  assert.equal(ranks.get("u3")?.rank, 3);
  assert.equal(ranks.get("u1")?.total, 3);
});

test("findTourCountdownTargets hits T-10/T-5/T-3/T-1", () => {
  const now = new Date("2026-04-06T18:00:00Z");
  const shows = [
    {
      date: "2026-04-16",
      venue: "Sphere",
      city: "Las Vegas",
      timeZone: "America/Los_Angeles",
      tour: "Sphere '26",
    },
  ];
  const hits = findTourCountdownTargets(shows, now);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].days_remaining, 10);
  assert.equal(hits[0].tourId, "Sphere '26");
});

test("findTourCountdownTargets hits T-3 for Summer Tour Jul 7 kickoff", () => {
  const now = new Date("2026-07-04T16:00:00Z");
  const shows = [
    {
      date: "2026-07-07",
      venue: "Kohl Center",
      city: "Madison, WI",
      timeZone: "America/Chicago",
      tour: "Summer Tour 2026",
    },
  ];
  const hits = findTourCountdownTargets(shows, now);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].days_remaining, 3);
  assert.equal(hits[0].tourId, "Summer Tour 2026");
});

test("findTourCountdownTargets: multi-tour snapshot hits Summer T-1 only (#514)", () => {
  // Flat showDates without tour labels collapses to earliest past opener → 0 hits.
  // With per-tour labels (showDatesByTour expansion), Summer T-1 still fires.
  const now = new Date("2026-07-06T16:00:00Z");
  const shows = [
    {
      date: "2026-04-16",
      venue: "Sphere",
      timeZone: "America/Los_Angeles",
      tour: "Sphere Run 2026",
      tour_name: "Sphere Run 2026",
    },
    {
      date: "2026-04-26",
      venue: "Sphere",
      timeZone: "America/Los_Angeles",
      tour: "Sphere Run 2026",
      tour_name: "Sphere Run 2026",
    },
    {
      date: "2026-07-07",
      venue: "Kohl Center",
      city: "Madison, WI",
      timeZone: "America/Chicago",
      tour: "Summer Tour 2026",
      tour_name: "Summer Tour 2026",
    },
    {
      date: "2026-07-08",
      venue: "Kohl Center",
      city: "Madison, WI",
      timeZone: "America/Chicago",
      tour: "Summer Tour 2026",
      tour_name: "Summer Tour 2026",
    },
  ];
  const hits = findTourCountdownTargets(shows, now);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].tourId, "Summer Tour 2026");
  assert.equal(hits[0].days_remaining, 1);
  assert.equal(hits[0].first_show_date, "2026-07-07");
});

test("findTourCountdownTargets: unlabeled flat list with past dates is a no-op (#514)", () => {
  const now = new Date("2026-07-06T16:00:00Z");
  const flatCollapsed = [
    { date: "2026-04-16", timeZone: "America/Los_Angeles" },
    { date: "2026-07-07", timeZone: "America/Chicago" },
  ];
  const hits = findTourCountdownTargets(flatCollapsed, now);
  assert.equal(hits.length, 0);
});

test("leaderUidFromScores returns sole leader only", () => {
  const picksSnap = {
    docs: [
      { id: "p1", data: () => ({ userId: "u1", picks: { opener: "a" } }) },
      { id: "p2", data: () => ({ userId: "u2", picks: { opener: "b" } }) },
    ],
  };
  assert.equal(
    leaderUidFromScores(new Map([["p1", 5], ["p2", 3]]), picksSnap),
    "u1"
  );
  assert.equal(
    leaderUidFromScores(new Map([["p1", 5], ["p2", 5]]), picksSnap),
    null
  );
});

test("loadUserIdsWithPicksForShowDates indexes non-empty picks (#509)", async () => {
  const db = {
    collection: () => ({
      where: () => ({
        get: async () => ({
          docs: [
            {
              data: () => ({
                showDate: "2026-07-18",
                userId: "u1",
                picks: { opener: "Tweezer" },
              }),
            },
            {
              data: () => ({
                showDate: "2026-07-18",
                userId: "u2",
                picks: {},
              }),
            },
            {
              data: () => ({
                showDate: "2026-07-20",
                userId: "u3",
                picks: { closer: "Slave" },
              }),
            },
          ],
        }),
      }),
    }),
  };
  const map = await loadUserIdsWithPicksForShowDates(db, ["2026-07-18", "2026-07-20"]);
  assert.equal(map.get("2026-07-18").has("u1"), true);
  assert.equal(map.get("2026-07-18").has("u2"), false);
  assert.equal(map.get("2026-07-20").has("u3"), true);
});
